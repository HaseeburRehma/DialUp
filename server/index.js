// server/index.js
const path = require('path')

// 1) Load the root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')
const session = require('express-session')

// 2) Use your cached connect helper
const { connect: connectDb } = require('./utils/db')

// ─── routers ───────────────────────────────────────────────────────────────
const authRouter       = require('./routes/auth')
const notesRouter      = require('./routes/note')
const transcribeRouter = require('./routes/transcribe')
const uploadRouter     = require('./routes/upload')
const twilioRouter     = require('./routes/twilio')

async function start() {
  // ─── 1) Connect to MongoDB (with caching) ────────────────────────────────
  try {
    const conn = await connectDb()
    console.log('✅ MongoDB connected to', conn.connection.host + ':' + conn.connection.port, '/', conn.connection.name)
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }

  // ─── 2) Create Express app ───────────────────────────────────────────────
  const app  = express()
  const PORT = process.env.PORT || 3001

  // ─── 3) Global middleware ────────────────────────────────────────────────
  app.use(cors({
    origin:      ['http://localhost:3000'], // adjust to your client
    credentials: true,
  }))
  app.use(express.json({  limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))
  app.use(session({
    secret:            process.env.SESSION_SECRET || 'dev-secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure:   process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge:   24 * 60 * 60 * 1000,
    },
  }))

  // ─── 4) Static folder for audio files ────────────────────────────────────
  app.use('/audio', express.static(path.join(__dirname, '../public/audio')))

  // ─── 5) Mount routers ───────────────────────────────────────────────────
  app.use('/api/auth',        authRouter)
  app.use('/api/notes',       notesRouter)
  app.use('/api/transcribe',  transcribeRouter)
  app.use('/api/upload',      uploadRouter)
  app.use('/api/twilio-token', twilioRouter)

  // ─── 6) Health check ────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'OK', ts: new Date().toISOString() })
  })

  // ─── 7) Global error handler ────────────────────────────────────────────
  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.statusCode || 500).json({
      error: err.statusMessage || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' ? { message: err.message } : {}),
    })
  })

  // ─── 8) Start listening ─────────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log(`🚀 Server listening at http://localhost:${PORT}`)
  })
}

start()
