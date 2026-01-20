// server/index.js

const path = require("path");
const express = require("express");
const cors = require("cors");

const { createProxyMiddleware } = require("http-proxy-middleware");

// Memory monitoring and aggressive GC
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`📊 Memory: RSS=${(usage.rss / 1024 / 1024).toFixed(1)}MB, Heap=${(usage.heapUsed / 1024 / 1024).toFixed(1)}/${(usage.heapTotal / 1024 / 1024).toFixed(1)}MB, External=${(usage.external / 1024 / 1024).toFixed(1)}MB`);

  if (global.gc && usage.external > 150 * 1024 * 1024) {
    console.log(`🧹 Internal GC Triggered (External: ${(usage.external / 1024 / 1024).toFixed(1)}MB)`);
    global.gc();
  }
}, 30000);

const { connect: connectDb } = require("./utils/db");
const WebSocket = require('ws');
const { pushTranscript } = require("./utils/streamBus");

process.on("uncaughtException", err => {
  const isIgnorableError =
    err.code === 'WS_ERR_INVALID_UTF8' ||
    err.code === 'WS_ERR_INVALID_CLOSE_CODE' ||
    err.code === 'ECONNRESET' ||
    err.code === 'ENOENT' ||  // Added: file not found errors
    (err.message && (
      err.message.includes('Invalid WebSocket frame') ||
      err.message.includes('read ECONNRESET') ||
      err.message.includes('EPIPE') ||
      err.message.includes('No such file or directory') ||  // Added
      err.message.includes("Cannot read properties of undefined")  // Added
    ));

  if (isIgnorableError) {
    const now = Date.now();
    if (!global.lastWsErrorLog || now - global.lastWsErrorLog > 60000) {
      console.warn("⚠️  Suppressing recurring errors:", err.message);
      global.lastWsErrorLog = now;
    }
  } else {
    console.error("❌ Uncaught Exception:", err);
    const isFatal = !err.message || !err.message.toLowerCase().includes('websocket');
    if (isFatal) process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit on unhandled rejections in production
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

const dev = process.env.NODE_ENV !== "production";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

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

    if (dev) {
      console.log("⏳ Waiting for build artifacts to be written...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("📦 Creating Express app (standalone mode)...");
    const app = express();

    // Ensure NEXTAUTH_URL in prod
    if (!process.env.NEXTAUTH_URL) {
      const host = process.env.NEXT_PUBLIC_BASE_URL || "localhost:3000";
      process.env.NEXTAUTH_URL = dev
        ? "http://localhost:3000"
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

    // Static files
    if (process.env.NODE_ENV === "development") {
      app.use("/audio", express.static(path.join(__dirname, "../public/audio")));
    }

    // API routes
    try {
      app.use("/api/transcribe", jsonParser, urlParser, require("./routes/transcribe"));
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
        if (socket && !socket.destroyed) {
          socket.destroy();
        }
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

    const DECODE_POOL = Buffer.alloc(256 * 1024);
    const DECODE_VIEW = new Int16Array(DECODE_POOL.buffer, DECODE_POOL.byteOffset, DECODE_POOL.length / 2);

    function decodeMuLaw(buffer) {
      if (!buffer || buffer.length === 0) return Buffer.alloc(0);
      const numSamples = Math.min(buffer.length, DECODE_VIEW.length);

      for (let i = 0; i < numSamples; i++) {
        DECODE_VIEW[i] = decodeMuLawSample(buffer[i]);
      }

      const output = Buffer.allocUnsafe(numSamples * 2);
      DECODE_POOL.copy(output, 0, 0, numSamples * 2);
      return output;
    }

    const trackToSpeaker = {
      inbound: "caller",
      inbound_track: "caller",
      outbound: "agent",
      outbound_track: "agent",
    };

    app.ws("/twilio-stream", (ws, req) => {
      console.log("📞 Twilio media stream connected");

      const fs = require("fs");
      const debugFile = path.join("/tmp", `twilio-audio-${Date.now()}.raw`);
      let chunkCount = 0;
      let callSid = null;

      const whisperConn = new WebSocket(`ws://127.0.0.1:${whisperPort}/whisper`);

      whisperConn.on("open", () => {
        console.log("✅ Connected to Whisper backend");
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

        try {
          if (fs.existsSync(debugFile)) {
            fs.unlinkSync(debugFile);
            console.log("🧹 Cleaned up temporary audio file");
          }
        } catch (e) {
          console.error("⚠️ Failed to cleanup debug file:", e.message);
        }
      });

      ws.on("error", (err) => {
        console.error("❌ Twilio WebSocket error:", err.message);
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
        write: (msg) => {
          try {
            if (!res.writableEnded) {
              res.write(msg);
            }
          } catch (err) {
            console.error("⚠️ SSE write error:", err.message);
          }
        },
        close: () => {
          if (!res.writableEnded) {
            res.end();
          }
        },
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

    // Serve Next.js static files in standalone mode
    if (!dev) {
      const staticPath = path.join(__dirname, "../.next/static");
      const publicPath = path.join(__dirname, "../public");
      
      app.use("/_next/static", express.static(staticPath, {
        maxAge: "1y",
        immutable: true
      }));
      
      app.use("/public", express.static(publicPath, {
        maxAge: "1h"
      }));
    }

    // Catch-all for Next.js pages (if using custom server routing)
    // This is optional - remove if you're using pure API routes
    app.get("*", (req, res) => {
      // For standalone mode, you might want to proxy to Next.js
      // or serve the built files directly
      res.status(404).json({ error: "Not found" });
    });

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
    });

    server.on("upgrade", (req, socket, head) => {
      if (wsProxy && req.url.startsWith("/ws")) {
        console.log("⬆️ Forwarding WebSocket upgrade");
        wsProxy.upgrade(req, socket, head);
      }
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("💥 Failed to start Express backend:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

start();