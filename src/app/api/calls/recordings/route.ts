// src/app/api/calls/recordings/route.ts
// Improved: Handle array of recordings, update transcription if needed.

import { NextRequest, NextResponse } from "next/server"

import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'

export async function POST(req: NextRequest) {
  await connect();
  try {
    const { callId, recordings } = await req.json();

    const urls = Array.isArray(recordings)
      ? recordings
      : Array.isArray(recordings.urls)
        ? recordings.urls
        : recordings.url
          ? [recordings.url]
          : [];

    const update: any = { $set: {} };

    if (urls.length) update.$set.recordings = urls;
    if (recordings.transcription) update.$set.transcription = recordings.transcription;

    await Call.findByIdAndUpdate(callId, update);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Recordings update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
