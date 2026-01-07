// server/index.js

const path = require("path");
const express = require("express");
const cors = require("cors");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
// Memory monitoring to help debug crashes
// Memory monitoring and aggressive GC to prevent External memory spikes
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`📊 Memory: RSS=${(usage.rss / 1024 / 1024).toFixed(1)}MB, Heap=${(usage.heapUsed / 1024 / 1024).toFixed(1)}/${(usage.heapTotal / 1024 / 1024).toFixed(1)}MB, External=${(usage.external / 1024 / 1024).toFixed(1)}MB`);

  // Aggressively trigger GC if external memory is creeping up
  // Lowered threshold to 150MB to keep peaks even lower during compilation
  if (global.gc && usage.external > 150 * 1024 * 1024) {
    console.log(`🧹 Internal GC Triggered (External: ${(usage.external / 1024 / 1024).toFixed(1)}MB)`);
    global.gc();
  }
}, 30000);

const { connect: connectDb } = require("./utils/db");
const WebSocket = require('ws');
const { pushTranscript } = require("./utils/streamBus");

process.on("uncaughtException", err => {
  // IGNORE ALL WEBSOCKET/NETWORKING ERRORS TO PREVENT CRASHES
  const isIgnorableError =
    err.code === 'WS_ERR_INVALID_UTF8' ||
    err.code === 'WS_ERR_INVALID_CLOSE_CODE' ||
    err.code === 'ECONNRESET' ||
    (err.message && (
      err.message.includes('Invalid WebSocket frame') ||
      err.message.includes('read ECONNRESET') ||
      err.message.includes('EPIPE')
    ));

  if (isIgnorableError) {
    // Only log once per minute to avoid spamming the console
    const now = Date.now();
    if (!global.lastWsErrorLog || now - global.lastWsErrorLog > 60000) {
      console.warn("⚠️  Suppressing recurring WebSocket/Network errors...");
      global.lastWsErrorLog = now;
    }
  } else {
    console.error("❌ Uncaught Exception:", err);
    // CRITICAL: Only exit on legitimate server logic failures
    // Do NOT exit on networking hiccups
    const isFatal = !err.message || !err.message.toLowerCase().includes('websocket');
    if (isFatal) process.exit(1);
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

    // Give Next.js time to write all build artifacts in development
    if (dev) {
      console.log("⏳ Waiting for build artifacts to be written...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

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

    // Security Headers & Permissions Policy for Microphone
    app.use((req, res, next) => {
      res.setHeader("Permissions-Policy", "microphone=(self)");
      res.setHeader("Feature-Policy", "microphone 'self'");
      res.setHeader("X-Content-Type-Options", "nosniff");
      next();
    });

    app.use(
      ["/api/transcribe", "/api/upload", "/api/twilio-token"],
      cors({ origin: allowedOrigins, credentials: true })
    );

    const jsonParser = express.json({ limit: "50mb" });
    const urlParser = express.urlencoded({ extended: true, limit: "50mb" });
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

    // ✅ ZERO-ALLOCATION AUDIO DECODING
    // We pre-allocate a single Buffer and an Int16Array view on it.
    // decodeMuLaw writes directly to the view, returning a sliced buffer.
    const DECODE_POOL = Buffer.alloc(1024 * 1021); // ~1MB
    const DECODE_VIEW = new Int16Array(DECODE_POOL.buffer, DECODE_POOL.byteOffset, DECODE_POOL.length / 2);

    function decodeMuLaw(buffer) {
      if (!buffer || buffer.length === 0) return Buffer.alloc(0);

      // mu-law is 8-bit, 1 sample per byte. output is 16-bit (2 bytes).
      const numSamples = Math.min(buffer.length, DECODE_VIEW.length);

      for (let i = 0; i < numSamples; i++) {
        DECODE_VIEW[i] = decodeMuLawSample(buffer[i]);
      }

      // ✅ COLLISION-SAFE RETURN
      // We copy the samples into a small, fresh Buffer.
      // Small buffers (<4KB) are pooled by Node.js, so this is very fast
      // and won't trigger the "Array buffer allocation failed" RangeError.
      // it also protects against data being overwritten before it's sent.
      const output = Buffer.allocUnsafe(numSamples * 2);
      DECODE_POOL.copy(output, 0, 0, numSamples * 2);
      return output;
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

        // Clean up debug file
        try {
          if (fs.existsSync(debugFile)) {
            fs.unlinkSync(debugFile);
            console.log("🧹 Cleaned up temporary audio file:", debugFile);
          }
        } catch (e) {
          console.error("⚠️ Failed to cleanup debug file:", e.message);
        }
      });
    });

    // Stream live transcripts via SSE
    const { addClient, removeClient } = require("./utils/streamBus");
    app.get("/api/voice/stream", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const client = {
        write: (msg) => res.write(msg),
        close: () => res.end(),
      };
      addClient(client);

      req.on("close", () => {
        removeClient(client);
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
      if (req.url.startsWith('/ws')) {
        console.log("⬆️ Forwarding WebSocket upgrade");
        wsProxy.upgrade(req, socket, head);
      }
    });

  } catch (error) {
    console.error("💥 Failed to start Express backend:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

start();