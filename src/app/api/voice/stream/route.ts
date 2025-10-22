// src/app/api/voice/stream/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- active SSE clients
interface SSEClient {
  write: (data: string) => void;
  close: () => void;
}
const clients: SSEClient[] = [];

// --- broadcast helper used by Express server
export function pushTranscript(payload: {
  text: string;
  track?: string;
  final?: boolean;
}) {
  const speaker =
  payload.track === "inbound_track" ? "caller" :
  payload.track === "outbound_track" ? "agent" : "unknown";


  const data = {
    id: Date.now().toString(),
    speaker,
    content: payload.text,
    final: payload.final || false,
  };

  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of [...clients]) {
    try {
      client.write(msg);
    } catch (err) {
      console.error("⚠️ Dropping SSE client:", err);
      client.close();
      clients.splice(clients.indexOf(client), 1);
    }
  }
}

// --- GET (SSE stream for browser)
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const keepalive = setInterval(() => {
        controller.enqueue(enc.encode(": keepalive\n\n"));
      }, 15000);

      const client: SSEClient = {
        write: (data) => controller.enqueue(enc.encode(data)),
        close: () => clearInterval(keepalive),
      };

      clients.push(client);
    },
    cancel() {
      clients.forEach((c) => c.close());
      clients.length = 0;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}

// --- CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
