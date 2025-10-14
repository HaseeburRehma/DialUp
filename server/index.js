// server/index.js

const path = require("path");
const express = require("express");
const cors = require("cors");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { connect: connectDb } = require("./utils/db");

// Add process error handlers at the very top
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Load .env only in dev
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const dev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;
const whisperPort = process.env.WHISPER_PORT || 4000;
const WebSocket = require('ws');
const whisperWs = new WebSocket('ws://127.0.0.1:4000/whisper');

async function start() {
  try {
    console.log("🔗 Connecting to database...");
    const dbPromise = connectDb();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout after 30s")), 30000)
    );
    const conn = await Promise.race([dbPromise, timeoutPromise]);
    console.log(
      "✅ MongoDB connected to",
      `${conn.connection.host}:${conn.connection.port}`,
      "/",
      conn.connection.name
    );

    console.log("📦 Preparing Next.js...");
    const nextApp = next({ dev, dir: path.resolve(__dirname, "..") });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    console.log("🚀 Next.js prepared, creating Express app...");
    const app = express();

    // Ensure NEXTAUTH_URL in prod
    if (!process.env.NEXTAUTH_URL) {
      const host = process.env.RAILWAY_STATIC_URL || `localhost:${PORT}`;
      process.env.NEXTAUTH_URL = dev
        ? `http://localhost:${PORT}`
        : `https://${host}`;
      console.log(`ℹ️ NEXTAUTH_URL set to ${process.env.NEXTAUTH_URL}`);
    }

    const allowedOrigins = [
      process.env.FRONTEND_ORIGIN,
      process.env.NEXTAUTH_URL,
      dev ? "http://localhost:3000" : undefined,
    ].filter(Boolean);

    console.log("🔐 CORS allowed origins:", allowedOrigins);

    app.use(
      ["/api/transcribe", "/api/upload", "/api/twilio-token"],
      cors({ origin: allowedOrigins, credentials: true })
    );

    const jsonParser = express.json({ limit: "500mb" });
    const urlParser = express.urlencoded({ extended: true, limit: "500mb" });
    const expressWs = require('express-ws')(app);
    const sseClients = [];

    // Static files
    app.use("/audio", express.static(path.join(__dirname, "../public/audio")));

    // API routes
    try {
      app.use("/api/transcribe", jsonParser, urlParser, require("./routes/transcribe"));
      app.use("/api/upload", jsonParser, urlParser, require("./routes/upload"));
      // app.use("/api/twilio-token", jsonParser, urlParser, require("./routes/twilio"));
      console.log("✅ API routes loaded");
    } catch (error) {
      console.error("❌ Failed to load API routes:", error);
      throw error;
    }
    // helper to broadcast to all browser clients
    function pushTranscript(payload) {
      const speaker =
        payload.track === "inbound_track"
          ? "caller"
          : payload.track === "outbound_track"
            ? "agent"
            : "unknown";

      const data = {
        id: Date.now().toString(),
        speaker,
        content: payload.text,
        final: payload.final || false,
      };

      const msg = `data: ${JSON.stringify(data)}\n\n`;
      for (const client of [...sseClients]) {
        try {
          client.write(msg);
        } catch (err) {
          console.error("⚠️ Dropping SSE client:", err);
          client.end();
          sseClients.splice(sseClients.indexOf(client), 1);
        }
      }
    }

    // SSE endpoint to connect from frontend
    app.get("/api/voice/stream", (req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      sseClients.push(res);
      console.log("🧩 Browser connected to /api/voice/stream");

      req.on("close", () => {
        console.log("❌ Browser disconnected from /api/voice/stream");
        const i = sseClients.indexOf(res);
        if (i >= 0) sseClients.splice(i, 1);
      });
    });
    // WebSocket proxy
    console.log(`🎤 Setting up WebSocket proxy to Whisper backend on port ${whisperPort}`);
    const wsProxy = createProxyMiddleware({
      target: `http://127.0.0.1:${whisperPort}`,
      changeOrigin: true,
      ws: true,
      logLevel: dev ? "debug" : "warn",
      onError: (err, req, socket) => {
        console.error("❌ WebSocket proxy error:", err.message);
        socket.destroy();
      },
    });
    app.use("/ws", wsProxy);

    // --- μ-law decoder ---
    function decodeMuLawSample(muLawByte) {
      const MULAW_MAX = 0x1FFF;
      const MULAW_BIAS = 33;
      muLawByte = ~muLawByte;

      const sign = (muLawByte & 0x80) ? -1 : 1;
      const exponent = (muLawByte >> 4) & 0x07;
      const mantissa = muLawByte & 0x0F;
      const sample = ((mantissa << 4) + MULAW_BIAS) << (exponent + 3);
      return sign * (sample > MULAW_MAX ? MULAW_MAX : sample);
    }

    function decodeMuLaw(buffer) {
      const out = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        out[i] = decodeMuLawSample(buffer[i]);
      }
      return Buffer.from(out.buffer);
    }

    // --- Twilio WebSocket Stream Route ---
    app.ws('/ws/twilio-stream', (ws, req) => {
      console.log('🔊 Twilio stream connected');

      // Create a new Whisper connection per call
      const whisperConn = new WebSocket(`ws://127.0.0.1:${whisperPort}/whisper`);

      whisperConn.on('open', () => {
        console.log('🧠 Connected to Whisper backend');
        whisperConn.send(JSON.stringify({
          task: 'transcribe',
          uid: `twilio-${Date.now()}`,
          language: 'en',
          model: 'base',
          stream: true,
          use_vad: true,
          sample_rate: 8000,  // Twilio sends 8kHz audio
          chunk_size: 2048
        }));
      });

      // Handle Whisper output and push to browser SSE
      whisperConn.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.text || data.message) {
            pushTranscript({
              text: data.text || data.message,
              track: 'inbound_track'
            });
          }
        } catch (err) {
          console.error('⚠️ Whisper message parse error:', err);
        }
      });

      whisperConn.on('error', (err) => {
        console.error('💥 Whisper connection error:', err);
      });

      whisperConn.on('close', (code, reason) => {
        console.log(`🧠 Whisper closed (${code || 1000}): ${reason || 'no reason'}`);
      });

      // Handle Twilio audio events
      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg);

          if (data.event === 'start') {
            console.log('▶️ Stream started:', data.start.callSid);
          }

          if (data.event === 'media') {
            const muLawBuf = Buffer.from(data.media.payload, 'base64');
            const pcmBuf = decodeMuLaw(muLawBuf);

            if (whisperConn.readyState === WebSocket.OPEN) {
              whisperConn.send(pcmBuf);
            }
          }

          if (data.event === 'stop') {
            console.log('⏹️ Stream stopped');
            if (whisperConn.readyState === WebSocket.OPEN) {
              whisperConn.send(new TextEncoder().encode('END_OF_AUDIO'));
              // Use valid close code (1000 = normal)
              whisperConn.close(1000, 'Stream ended');
            }
          }
        } catch (err) {
          console.error('⚠️ Twilio message error:', err);
        }
      });

      ws.on('close', () => {
        console.log('❌ Twilio stream closed');
        if (whisperConn.readyState === WebSocket.OPEN) {
          whisperConn.close(1000, 'Twilio client disconnected');
        }
      });
    });


    // Health check
    app.get("/health", (_req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        whisper_port: whisperPort,
      });
    });

    // Next.js catch-all
    app.all("*", (req, res) => handle(req, res));

    // Start server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
    });

    // WebSocket upgrade forwarding
    server.on("upgrade", (req, socket, head) => {
      console.log("🔄 Forwarding WebSocket upgrade to Whisper backend");
      wsProxy.upgrade(req, socket, head);
    });

  } catch (error) {
    console.error("❌ Failed to start Express backend:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

start();
