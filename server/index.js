// server/index.js

const path = require("path");
const express = require("express");
const cors = require("cors");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { connect: connectDb } = require("./utils/db");
const WebSocket = require('ws');
const { pushTranscript } = require("./utils/streamBus");

process.on("uncaughtException", err => {
  if (err.code === 'WS_ERR_INVALID_UTF8' || err.code === 'WS_ERR_INVALID_CLOSE_CODE') {
    console.warn("⚠️ Ignored WebSocket frame error:", err.message);
  } else {
    console.error("❌ Uncaught:", err);
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const dev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT) || 3000;
const whisperPort = process.env.WHISPER_PORT || 4000;

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
    if (process.env.NODE_ENV === "development") {
      app.use("/audio", express.static(path.join(__dirname, "../public/audio")));
    }

    // API routes
    try { 
      app.use("/api/transcribe", jsonParser, urlParser, require("./routes/transcribe"));
 //   app.use("/api/upload", jsonParser, urlParser, require("./routes/upload"));
      console.log("✅ API routes loaded");
    } catch (error) {
      console.error("❌ Failed to load API routes:", error);
      throw error;
    }



    // WebSocket proxy
    console.log(`🎤 Setting up WebSocket proxy to port ${whisperPort}`);
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

    // μ-law decoder
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

    //  Twilio WebSocket with proper speaker tracking

    // Twilio WebSocket endpoint: receives both inbound & outbound tracks
    app.ws("/twilio-stream", (ws, req) => {
      console.log(" Twilio media stream connected");

      const fs = require("fs");
      const path = require("path");
      const debugFile = path.join("/tmp", `twilio-audio-${Date.now()}.raw`);
      let chunkCount = 0;
      let callSid = null;

      const trackToSpeaker = {
        inbound: "caller",
        inbound_track: "caller",
        outbound: "agent",
        outbound_track: "agent",
      };

      const whisperConn = new WebSocket(`ws://127.0.0.1:${whisperPort}/whisper`);

      whisperConn.on("open", () => {
        console.log(" Connected to Whisper backend");
        whisperConn.send(
          JSON.stringify({
            task: "transcribe",
            uid: `twilio-${Date.now()}`,
            language: "en",
            model: "base",
            stream: true,
            use_vad: true,
            sample_rate: 8000,
            chunk_size: 2048,
          })
        );
      });

      whisperConn.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          const text = data.text || data.message;
          if (!text) return;

          const track = data.track || "unknown";
          const speaker = trackToSpeaker[track] || data.speaker || "unknown";

          console.log(`📝 Transcript [${speaker}] → ${text.slice(0, 80)}…`);

          pushTranscript({
            text,
            track,
            speaker,
            final: data.final || false,
          });
        } catch (err) {
          console.error("❌ Whisper message parse error:", err);
        }
      });

      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg);
          if (data.event === "start") {
            callSid = data.start.callSid;
            console.log("📞 Stream started:", callSid);
          }

          if (data.event === "media") {
            const muLawBuf = Buffer.from(data.media.payload, "base64");
            const pcmBuf = decodeMuLaw(muLawBuf);
            const track = data.media.track;
            const speaker = trackToSpeaker[track] || "unknown";

            if (chunkCount < 10) {
              fs.appendFileSync(debugFile, pcmBuf);
              chunkCount++;
            }

            if (whisperConn.readyState === WebSocket.OPEN) {
              whisperConn.send(
                JSON.stringify({ event: "media", track, speaker, callSid })
              );
              whisperConn.send(pcmBuf);
            }
          }

          if (data.event === "stop") {
            console.log("🛑 Stream stopped");
            if (whisperConn.readyState === WebSocket.OPEN) {
              whisperConn.send(new TextEncoder().encode("END_OF_AUDIO"));
              whisperConn.close(1000, "Stream ended");
            }
          }
        } catch (err) {
          console.error("❌ Twilio message error:", err);
        }
      });

      ws.on("close", () => {
        console.log("🔴 Twilio stream closed");
        if (whisperConn.readyState === WebSocket.OPEN)
          whisperConn.close(1000, "Twilio client disconnected");
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

    app.all("/api/auth/*", (req, res) => handle(req, res));
    app.all("*", (req, res) => handle(req, res));

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
    });

    server.on("upgrade", (req, socket, head) => {
      console.log("⬆️ Forwarding WebSocket upgrade");
      wsProxy.upgrade(req, socket, head);
    });

  } catch (error) {
    console.error("💥 Failed to start Express backend:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

start();