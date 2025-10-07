// server/index.js

const path = require("path");
const express = require("express");
const cors = require("cors");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { connect: connectDb } = require("./utils/db");

const { WebSocketServer } = require("ws");
const fs = require("fs");
const os = require("os");
const FormData = require("form-data");
const { pushTranscript } = require("./utils/sse");

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
const whisperPort = process.env.WHISPER_PORT || 4001;

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
    // 🧠 Twilio Media Stream WebSocket
    const wss = new WebSocketServer({ noServer: true });
    let audioBuffers = [];

    wss.on("connection", (ws) => {
      console.log("🎧 Twilio WebSocket connected");

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.event === "start") {
            console.log("🚀 Stream started:", data.start);
            audioBuffers = [];
          }

          if (data.event === "media" && data.media?.payload) {
            const pcm = Buffer.from(data.media.payload, "base64");
            audioBuffers.push(pcm);

            if (audioBuffers.length >= 35) { // ~2.5 seconds of audio at 8000 Hz
              const wavBuffer = pcmToWav(Buffer.concat(audioBuffers), 8000);
              audioBuffers = [];
              await transcribeChunk(wavBuffer, data.media.track);

            }
          }

          if (data.event === "stop") {
            console.log("🛑 Stream stopped. Transcribing final chunk...");
            if (audioBuffers.length > 0) {
              const wavBuffer = pcmToWav(Buffer.concat(audioBuffers), 8000);
              await transcribeChunk(wavBuffer, "final");
              audioBuffers = [];
            }
          }

        } catch (err) {
          console.error("❌ WS message error:", err);
        }
      });

      ws.on("close", () => console.log("🔌 Twilio WS closed"));
    });

    // WebSocket upgrade forwarding
    server.on("upgrade", (req, socket, head) => {
      if (req.url === "/api/voice/stream") {
        console.log("🔄 Twilio is connecting to /api/voice/stream");
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      } else {
        console.log("🔄 Forwarding other WebSockets to Whisper backend");
        wsProxy.upgrade(req, socket, head);
      }
    });


  } catch (error) {
    console.error("❌ Failed to start Express backend:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}
function pcmToWav(buffer, sampleRate = 8000) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + buffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(buffer.length, 40);
  return Buffer.concat([header, buffer]);
}

async function transcribeChunk(wavBuffer, track = "unknown") {
  const tmpPath = path.join(os.tmpdir(), `twilio-${Date.now()}.wav`);
  fs.writeFileSync(tmpPath, wavBuffer);

  try {
    const form = new FormData();
    form.append("audio", fs.createReadStream(tmpPath));
    const resp = await fetch(`${process.env.BASE_URL}/api/server/transcribe`, {
      method: "POST",
      body: form,
    });

    if (resp.ok) {
      const { text } = await resp.json();
      console.log(`🧠 Whisper (${track}):`, text);
      pushTranscript({ text, track }); // ✅ Broadcast to frontend
      console.log(`📡 Broadcasted transcript (${track}):`, text);

    } else {
      console.error("Whisper failed:", await resp.text());
    }
  } catch (err) {
    console.error("Transcription error:", err);
  } finally {
    fs.unlink(tmpPath, () => { });
  }
}

start();