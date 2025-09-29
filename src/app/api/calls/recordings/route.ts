// src/app/api/calls/recordings/route.ts

import { NextRequest, NextResponse } from "next/server"

import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'
export async function POST(req: NextRequest) {
  await connect()
  try {
    const { callId, recordings } = await req.json()
    await Call.findByIdAndUpdate(callId, { $set: { recording: recordings } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
