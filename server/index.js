const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { connect: connectDb } = require('./utils/db');

async function start() {
  // 1) Connect DB
  try {
    const conn = await connectDb();
    console.log(
      '✅ MongoDB connected to',
      `${conn.connection.host}:${conn.connection.port}`,
      '/',
      conn.connection.name
    );
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e.message);
    process.exit(1);
  }

  // 2) Prepare Next.js
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev, dir: path.resolve(__dirname, '..') });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // 3) Create Express app
  const app = express();

  // ✅ Always ensure CORS origin matches FRONTEND_ORIGIN or Railway's domain
  const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    process.env.NEXTAUTH_URL,
    dev ? 'http://localhost:3000' : undefined
  ].filter(Boolean);

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

  // API routes
  app.use('/api/transcribe', jsonParser, urlParser, require('./routes/transcribe'));
  app.use('/api/upload', jsonParser, urlParser, require('./routes/upload'));
  app.use('/api/twilio-token', jsonParser, urlParser, require('./routes/twilio'));

  // ✅ WebSocket proxy to Whisper service with better resilience
  app.use(
    '/ws',
    createProxyMiddleware({
      target: `ws://127.0.0.1:${process.env.WHISPER_PORT || 4000}`,
      changeOrigin: true,
      ws: true,
      logLevel: dev ? 'debug' : 'warn',
      onError: (err, req, res) => {
        console.error('❌ WS proxy error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('Whisper backend unavailable, retrying...');
        }
      }
    })
  );

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

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
  });
}

start()
  .then(() => console.log('✅ Express backend started successfully'))
  .catch(err => {
    console.error('❌ Fatal error starting backend:', err);
    process.exit(1);
  });

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});
