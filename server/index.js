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
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)); // ✅ Node18 fix
const { pushTranscript } = require("./utils/sse");

// Error safety
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", promise, "reason:", reason);
});

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const dev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;
const whisperPort = process.env.WHISPER_PORT || 4001;

async function start() {
  try {
    console.log("🔗 Connecting to database...");
    const conn = await Promise.race([
      connectDb(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("DB timeout")), 30000)),
    ]);
    console.log(`✅ MongoDB connected to ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    console.log("📦 Preparing Next.js...");
    const nextApp = next({ dev, dir: path.resolve(__dirname, "..") });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    console.log("🚀 Next.js ready, starting Express...");
    const app = express();

    // Environment setup
    if (!process.env.NEXTAUTH_URL) {
      const host = process.env.RAILWAY_STATIC_URL || `localhost:${PORT}`;
      process.env.NEXTAUTH_URL = dev ? `http://localhost:${PORT}` : `https://${host}`;
    }

    const allowedOrigins = [
      process.env.FRONTEND_ORIGIN,
      process.env.NEXTAUTH_URL,
      dev ? "http://localhost:3000" : undefined,
    ].filter(Boolean);

    console.log("🔐 CORS allowed origins:", allowedOrigins);

    // ✅ CORS before everything
    app.use(
      [
        "/api/transcribe",
        "/api/upload",
        "/api/twilio-token",
        "/api/voice/stream",
        "/whisper",
      ],
      cors({ origin: allowedOrigins, credentials: true })
    );

    const jsonParser = express.json({ limit: "500mb" });
    const urlParser = express.urlencoded({ extended: true, limit: "500mb" });

    // Static
    app.use("/audio", express.static(path.join(__dirname, "../public/audio")));

    // Routes
    app.use("/api/transcribe", jsonParser, urlParser, require("./routes/transcribe"));
    app.use("/api/upload", jsonParser, urlParser, require("./routes/upload"));
    console.log("✅ API routes loaded");

    // ✅ Whisper WebSocket proxy
    console.log(`🎤 Setting up Whisper proxy → :${whisperPort}`);
    const wsProxy = createProxyMiddleware({
      target: `http://127.0.0.1:${whisperPort}`,
      changeOrigin: true,
      ws: true,
      logLevel: dev ? "debug" : "silent",
      onError: (err, req, socket) => {
        console.error("❌ Whisper WS proxy error:", err.message);
        socket.destroy();
      },
    });
    app.use("/whisper", wsProxy);

    // Health check
    app.get("/health", (_req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        whisper_port: whisperPort,
      });
    });

    // ✅ SSE endpoint
    const { addClient, removeClient } = require("./utils/sse");

    app.get("/api/voice/stream", (req, res) => {
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();

      const client = { write: (d) => res.write(d), close: () => res.end() };
      addClient(client);
      console.log("👂 SSE client connected");

      const keepalive = setInterval(() => res.write(":keepalive\n\n"), 15000);
      req.on("close", () => {
        clearInterval(keepalive);
        removeClient(client);
        console.log("👋 SSE client disconnected");
      });
    });

    // ✅ Next.js catch-all LAST
    app.all("*", (req, res) => handle(req, res));

    const server = app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`)
    );

    // --- Twilio Media Stream (WS)
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
            if (audioBuffers.length >= 35) {
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

    // ✅ WebSocket upgrade routing
    server.on("upgrade", (req, socket, head) => {
      if (req.url.startsWith("/whisper")) {
        console.log("🔄 Whisper WS upgrade → backend");
        wsProxy.upgrade(req, socket, head);
      } else if (req.url === "/api/voice/stream") {
        console.log("🔄 Twilio WS → /api/voice/stream");
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      } else {
        socket.destroy();
      }
    });
  } catch (err) {
    console.error("❌ Startup failure:", err);
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
    const resp = await fetch(`http://127.0.0.1:${whisperPort}/transcribe`, {
      method: "POST",
      body: form,
    });
    if (resp.ok) {
      const { text } = await resp.json();
      console.log(`🧠 Whisper (${track}):`, text);
      pushTranscript({ text, track });
    } else {
      console.error("Whisper failed:", await resp.text());
    }
  } catch (err) {
    console.error("Transcription error:", err);
  } finally {
    fs.unlink(tmpPath, () => {});
  }
}

start();
