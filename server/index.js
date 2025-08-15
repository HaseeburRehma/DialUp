const path = require('path');

// Add process error handlers at the very top
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

console.log('🔍 Starting Express backend...');
console.log('Environment variables check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- FRONTEND_ORIGIN:', process.env.FRONTEND_ORIGIN);
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('- WHISPER_PORT:', process.env.WHISPER_PORT);

const express = require('express');
const cors = require('cors');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { connect: connectDb } = require('./utils/db');

async function start() {
  try {
    console.log('🔗 Connecting to database...');

    // 1) Connect DB with timeout
    const dbPromise = connectDb();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout after 30s')), 30000)
    );

    const conn = await Promise.race([dbPromise, timeoutPromise]);
    console.log(
      '✅ MongoDB connected to',
      `${conn.connection.host}:${conn.connection.port}`,
      '/',
      conn.connection.name
    );

    console.log('📦 Preparing Next.js...');

    // 2) Prepare Next.js
    const dev = process.env.NODE_ENV !== 'production';
    const nextApp = next({ dev, dir: path.resolve(__dirname, '..') });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    console.log('🚀 Next.js prepared, creating Express app...');

    // 3) Create Express app
    const app = express();

    // ✅ Always ensure CORS origin matches FRONTEND_ORIGIN or Railway's domain
    const allowedOrigins = [
      process.env.FRONTEND_ORIGIN,
      process.env.NEXTAUTH_URL,
      dev ? 'http://localhost:3000' : undefined
    ].filter(Boolean);

    console.log('🔐 CORS allowed origins:', allowedOrigins);

    app.use(
      ['/api/transcribe', '/api/upload', '/api/twilio-token'],
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );

    const jsonParser = express.json({ limit: '50mb' });
    const urlParser = express.urlencoded({ extended: true, limit: '50mb' });

    // Static files
    app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

    // API routes with error handling
    try {
      app.use('/api/transcribe', jsonParser, urlParser, require('./routes/transcribe'));
      app.use('/api/upload', jsonParser, urlParser, require('./routes/upload'));
      app.use('/api/twilio-token', jsonParser, urlParser, require('./routes/twilio'));
      console.log('✅ API routes loaded');
    } catch (error) {
      console.error('❌ Failed to load API routes:', error);
      throw error;
    }

    // ✅ WebSocket proxy to Whisper service with better resilience

    const { Server } = require('ws');
    const net = require('net');

    // Remove the proxy middleware section and replace with:

    // ✅ Direct WebSocket Server with internal forwarding
    const whisperPort = process.env.WHISPER_PORT || 4000;
    console.log(`🎤 Setting up direct WebSocket server forwarding to port ${whisperPort}`);

    // Create WebSocket server attached to your Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
      console.log('✅ Express backend started successfully');
    });

    // WebSocket server
    const wss = new Server({
      server,
      path: '/ws',
      perMessageDeflate: false // Better for real-time audio
    });

    wss.on('connection', (ws, request) => {
      console.log('🔗 WebSocket client connected');

      // Create connection to internal Whisper service
      const whisperSocket = new net.Socket();
      let isWhisperConnected = false;

      whisperSocket.connect(whisperPort, '127.0.0.1', () => {
        console.log('✅ Connected to internal Whisper service');
        isWhisperConnected = true;
      });

      whisperSocket.on('error', (err) => {
        console.error('❌ Whisper socket error:', err.message);
        ws.close(1011, 'Internal service unavailable');
      });

      whisperSocket.on('close', () => {
        console.warn('⚠️ Whisper service disconnected');
        ws.close(1011, 'Internal service disconnected');
      });

      // Forward data: Client -> Whisper
      ws.on('message', (data) => {
        if (isWhisperConnected) {
          try {
            if (typeof data === 'string') {
              // JSON control messages
              whisperSocket.write(data);
            } else {
              // Binary audio data
              whisperSocket.write(data);
            }
          } catch (err) {
            console.error('❌ Error forwarding to Whisper:', err);
          }
        }
      });

      // Forward data: Whisper -> Client
      whisperSocket.on('data', (data) => {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(data);
          } catch (err) {
            console.error('❌ Error sending to client:', err);
          }
        }
      });

      // Cleanup on client disconnect
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        if (whisperSocket && !whisperSocket.destroyed) {
          whisperSocket.destroy();
        }
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err);
        if (whisperSocket && !whisperSocket.destroyed) {
          whisperSocket.destroy();
        }
      });
    });
    // Health check
    app.get('/health', (_req, res) => {
      console.log('💓 Health check requested');
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        whisper_port: whisperPort
      });
    });

    // Next.js handles all other routes
    app.all('*', (req, res) => handle(req, res));

    // 4) Start server — default to Railway's PORT
    const PORT = Number(process.env.PORT) || 3000;

    // ✅ Ensure NEXTAUTH_URL is set dynamically if not provided
    if (!process.env.NEXTAUTH_URL) {
      const host = process.env.RAILWAY_STATIC_URL || `localhost:${PORT}`;
      process.env.NEXTAUTH_URL = `https://${host}`;
      console.log(`ℹ️ NEXTAUTH_URL set to ${process.env.NEXTAUTH_URL}`);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
      console.log('✅ Express backend started successfully');
    });

  } catch (error) {
    console.error('❌ Failed to start Express backend:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

console.log('🎯 Calling start function...');
start();