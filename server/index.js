const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const next = require('next');

// your mongoose connect helper
const { connect: connectDb } = require('./utils/db');

async function start() {
  // 1) Connect DB once
  try {
    const conn = await connectDb();
    console.log('✅ MongoDB connected to', `${conn.connection.host}:${conn.connection.port}`, '/', conn.connection.name);
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e.message);
    process.exit(1);
  }

  // 2) Prepare Next
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // 3) Express app + middleware
  const app = express();

  // CORS for specific API routes only (not auth routes)
  app.use(['/api/transcribe', '/api/upload', '/api/twilio-token'], cors({
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
    credentials: true,
  }));

  const jsonParser = express.json({ limit: '50mb' });
  const urlParser = express.urlencoded({ extended: true, limit: '50mb' });

  // Static files
  app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

  // Only mount non-auth API routes here
  // Remove the /api/notes route since it's handled by Next.js API routes
  app.use('/api/transcribe', jsonParser, urlParser, require('./routes/transcribe'));
  app.use('/api/upload', jsonParser, urlParser, require('./routes/upload'));
  app.use('/api/twilio-token', jsonParser, urlParser, require('./routes/twilio'));

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Let Next handle everything else (including all /api/auth/* and /api/notes/*)
  app.all('*', (req, res) => handle(req, res));

  // 5) Listen ONCE on the platform port
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}

start();