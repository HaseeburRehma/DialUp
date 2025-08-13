const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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

  app.use(['/api/notes', '/api/transcribe', '/api/upload', '/api/twilio-token'], cors({
  origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
  credentials: true,
}));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) return next();
    return session({
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    })(req, res, next);
  });



  const jsonParser = express.json({ limit: '50mb' });
  const urlParser = express.urlencoded({ extended: true, limit: '50mb' });

  // static + API routes
  app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

  // DO apply parsers to your custom routes
  app.use('/api/notes', jsonParser, urlParser, require('./routes/note'));
  app.use('/api/transcribe', jsonParser, urlParser, require('./routes/transcribe'));
  app.use('/api/upload', jsonParser, urlParser, require('./routes/upload'));
  app.use('/api/twilio-token', jsonParser, urlParser, require('./routes/twilio'));

  // DO NOT mount anything at /api/auth — leave it to NextAuth
  // app.use('/api/auth', require('./routes/auth')); // keep disabled/removed

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Let Next handle everything else (including /api/auth/*)
  app.all('*', (req, res) => handle(req, res));
  // 5) Listen ONCE on the platform port
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}

start();
