// src/app/api/voice/stream/route.ts
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

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
  header.write("RIFF", 0); // ChunkID
  header.writeUInt32LE(36 + buffer.length, 4); // ChunkSize
  header.write("WAVE", 8); // Format
  header.write("fmt ", 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(1, 22); // NumChannels (1 = mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write("data", 36); // Subchunk2ID
  header.writeUInt32LE(buffer.length, 40); // Subchunk2Size
  return Buffer.concat([header, buffer]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.event === "start") {
      console.log("🚀 Twilio stream started:", body.start);
      audioBuffers = [];
      transcriptLog = [];
    }

    if (body.event === "media" && body.media?.payload) {
      const audioBuffer = Buffer.from(body.media.payload, "base64");
      audioBuffers.push(audioBuffer);

      // flush in chunks to keep near-realtime
      if (audioBuffers.length >= 50) {
        await transcribeAndBroadcast();
      }
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

async function transcribeAndBroadcast(final = false) {
  if (audioBuffers.length === 0) return;

  const tmpPath = join(tmpdir(), `twilio-${Date.now()}.wav`);
  const buffer = Buffer.concat(audioBuffers);
  audioBuffers = []; // reset

  // Wrap PCM into WAV
  const wavBuffer = pcmToWav(buffer, 8000);
  await writeFile(tmpPath, wavBuffer);

  try {
    const form = new FormData();
    form.append(
      "audio",
      new File([wavBuffer], "chunk.wav", { type: "audio/wav" })
    );

    const resp = await fetch(`${process.env.BASE_URL}/api/server/transcribe`, {
      method: "POST",
      body: form,
    });

    if (resp.ok) {
      const { text } = await resp.json();
      if (text) {
        transcriptLog.push(text);
        broadcast({ text, final });
      }
    } else {
      console.error("Whisper failed:", await resp.text());
    }
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// SSE endpoint for frontend (live transcript stream)
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

      // Send transcript backlog
      transcriptLog.forEach((t) => send({ text: t }));

      // Keep alive every 15s
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
      // cleanup if browser disconnects
      clients.forEach((c) => c.close());
      clients.length = 0;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Broadcast transcript to all SSE clients
function broadcast(payload: { text: string; final?: boolean; speaker?: string }) {
  const data = {
    id: Date.now().toString(),
    speaker: payload.speaker || "unknown",
    content: payload.text,
    final: payload.final || false,
  };

  const sseData = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of [...clients]) {
    try {
      client.write(sseData);
    } catch (e) {
      console.error("SSE client write failed, removing client", e);
      client.close();
      const idx = clients.indexOf(client);
      if (idx !== -1) clients.splice(idx, 1);
    }
  }
}
