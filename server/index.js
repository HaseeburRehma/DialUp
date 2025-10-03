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
