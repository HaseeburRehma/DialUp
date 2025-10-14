// src/app/api/calls/recordings/route.ts
// Improved: Handle array of recordings, update transcription if needed.

import { NextRequest, NextResponse } from "next/server"

import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'

export async function POST(req: NextRequest) {
  await connect()
  try {
    const { callId, recordings } = await req.json()
    const updateData: any = { $set: { recordings: Array.isArray(recordings) ? recordings : [recordings] } }
    
    // If transcription provided in recordings, update it
    if (recordings && typeof recordings === 'object' && recordings.transcription) {
      updateData.$set.transcription = recordings.transcription
    }
    
    await Call.findByIdAndUpdate(callId, updateData)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Recordings update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}