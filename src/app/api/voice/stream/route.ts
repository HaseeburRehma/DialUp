// src/app/api/voice/stream/route.ts
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let audioBuffers: Buffer[] = [];
let transcriptLog: string[] = [];

interface SSEClient {
  write: (data: string) => void;
  close: () => void;
}

const clients: SSEClient[] = [];

/**
 * Convert raw PCM into a WAV file buffer
 * Default: 8kHz mono, 16-bit signed PCM (Twilio PCMU)
 */
function pcmToWav(buffer: Buffer, sampleRate = 8000) {
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("🛰️ STREAM EVENT:", body.event);

    if (body.event === "start") {
      console.log("🚀 Twilio stream started:", body.start);
      audioBuffers = [];
      transcriptLog = [];
    }

    if (body.event === "media" && body.media?.payload) {
      const audioBuffer = Buffer.from(body.media.payload, "base64");
      audioBuffers.push(audioBuffer);
      console.log("🎙️ Received media packet", audioBuffers.length);

      // flush every ~50 frames for near real-time updates
      const track = body.media.track;
      console.log(`🎙️ Received packet #${audioBuffers.length} (${track})`);
      if (audioBuffers.length >= 50) await transcribeAndBroadcast(false, track);

    }

    if (body.event === "stop") {
      console.log("🛑 Twilio stream stopped. Final transcription…");
      await transcribeAndBroadcast(true);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Stream route error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

let isTranscribing = false;

async function transcribeAndBroadcast(final = false, track?: string) {
  if (audioBuffers.length === 0 || isTranscribing) return;
  isTranscribing = true;

  const tmpPath = join(tmpdir(), `twilio-${Date.now()}.wav`);
  const buffer = Buffer.concat(audioBuffers);
  audioBuffers = [];
  const wavBuffer = pcmToWav(buffer, 8000);
  await writeFile(tmpPath, wavBuffer);




  try {
    const form = new FormData();
    form.append("audio", new File([wavBuffer], "chunk.wav", { type: "audio/wav" }));
    const resp = await fetch(`${process.env.BASE_URL}/api/server/transcribe`, { method: "POST", body: form });

    if (resp.ok) {
      const { text } = await resp.json();
      if (text) {
        transcriptLog.push(text);
        broadcast({ text, final, track });
      }
    } else console.error("Whisper failed:", await resp.text());
  } finally {
    await unlink(tmpPath).catch(() => { });
    isTranscribing = false;
  }
}


// SSE endpoint for frontend (live transcript stream)
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Send any existing transcript backlog
      transcriptLog.forEach((t) => send({ text: t }));

      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      const client: SSEClient = {
        write: (data: string) => controller.enqueue(encoder.encode(data)),
        close: () => clearInterval(interval),
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function broadcast(payload: { text: string; final?: boolean; track?: string }) {
  const speaker =
    payload.track === "inbound_track" ? "caller" :
      payload.track === "outbound_track" ? "agent" : "unknown";

  const data = {
    id: Date.now().toString(),
    speaker,
    content: payload.text,
    final: payload.final || false,
  };

  const sseData = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of [...clients]) {
    try {
      client.write(sseData);
    } catch (err) {
      console.error("⚠️ Dropping dead SSE client:", err);
      client.close();
      clients.splice(clients.indexOf(client), 1);
    }
  }
}
