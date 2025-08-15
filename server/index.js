const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Mongo connect helper
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

  // CORS for specific API routes
  app.use(
    ['/api/transcribe', '/api/upload', '/api/twilio-token'],
    cors({
      origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
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

  // WebSocket proxy to Whisper service
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://127.0.0.1:4000',
      changeOrigin: true,
      ws: true,
      logLevel: 'debug',
    })
  );

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Next.js handles all other routes
  app.all('*', (req, res) => handle(req, res));

  // 4) Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}

start();
