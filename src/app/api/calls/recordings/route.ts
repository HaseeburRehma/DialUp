// src/app/api/calls/recordings/route.ts
// Improved: Handle array of recordings, update transcription if needed.

import { NextRequest, NextResponse } from "next/server"

import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'

export async function POST(req: NextRequest) {
  await connect()
  try {
    const { callId, recordings, transcription } = await req.json()
    const updateData: any = { $set: {} }
    if (recordings) updateData.$set.recordings = Array.isArray(recordings) ? recordings : [recordings]
    if (transcription) updateData.$set.transcription = transcription

    await Call.findByIdAndUpdate(callId, updateData)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Recordings update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}