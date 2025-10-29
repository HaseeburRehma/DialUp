// src/app/api/twilio/transcription-callback/route.ts
import { NextRequest, NextResponse } from "next/server";

import { pushTranscript } from "../../../../../server/utils/streamBus";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const text = form.get("TranscriptionText") as string;
  const track = form.get("Track") as string;
  pushTranscript({ text, track, final: true }); // broadcast to active SSE clients
  return NextResponse.json({ ok: true });
}
