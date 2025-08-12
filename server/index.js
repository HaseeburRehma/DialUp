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

  app.use(cors({
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Use Mongo-backed session store (no MemoryStore warning)
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // needs https in prod
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // allow cross-site
      maxAge: 24 * 60 * 60 * 1000,
    },

  }));

  // static + API routes
  app.use('/audio', express.static(path.join(__dirname, '../public/audio')));
//  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/notes', require('./routes/note'));
  app.use('/api/transcribe', require('./routes/transcribe'));
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/twilio-token', require('./routes/twilio'));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // 4) Let Next handle everything else
  app.all('*', (req, res) => handle(req, res));

  // 5) Listen ONCE on the platform port
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}

start();
