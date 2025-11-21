// src/app/api/retell/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event || body.event_type;
  const call = body.call;

  if (!call) {
    return NextResponse.json({ error: 'Missing call object' }, { status: 400 });
  }

  // We only want the final analyzed payload (full transcript + analysis)
  if (event !== 'call_analyzed' && event !== 'call_ended') {
    return NextResponse.json({ ok: true }); // ignore other events
  }

  const transcript: string =
    call.transcript ||
    call.call_analysis?.summary ||
    '';

  const recordingUrl: string | undefined =
    call.recording_url ||
    call.scrubbed_recording_url ||
    undefined;

  const callerNumber: string =
    call.from_number || call.caller_number || 'Unknown';

  const receiverNumber: string =
    call.to_number || call.agent_phone_number || 'Unknown';

  // TODO: map numbers -> emails from your DB/CRM if you want per-caller emails.
  // For now, we'll just send to your existing automatic transcript endpoint.
  try {
    await fetch(`${APP_BASE_URL}/api/send-automatic-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        recordingUrl,
        callerNumber,
        receiverNumber,
        // if your existing handler expects these:
        callDuration: call.duration_ms
          ? Math.round(call.duration_ms / 1000) + 's'
          : undefined,
        callDate: call.start_timestamp
          ? new Date(call.start_timestamp).toISOString()
          : new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to forward transcript to email handler', err);
    // still return 2xx so Retell doesn’t keep retrying forever
  }

  return NextResponse.json({ ok: true });
}