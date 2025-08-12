// server/index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connect: connectDb } = require('./utils/db');

async function start() {
  // 1) DB
  try {
    const conn = await connectDb();
    console.log('✅ MongoDB connected to', `${conn.connection.host}:${conn.connection.port}`, '/', conn.connection.name);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // 2) App + middleware
  const app = express();

  app.use(cors({
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Use a real session store in prod
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: 'vhisper',
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

  // 3) Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/note', require('./routes/note'));
  app.use('/api/transcribe', require('./routes/transcribe'));
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/twilio-token', require('./routes/twilio'));

  app.get('/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

  // 4) Listen ONCE, at the end
  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${PORT}`);
  });
}

start();
