
// src/app/api/calls/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../server/utils/db'
import Call from '../../../../server/models/Call'
import { verifyUserToken } from '../../../../server/utils/verifyToken'

export async function POST(req: NextRequest) {
  try {
    await connect()
    const user = await verifyUserToken(req)
    const body = await req.json()

    const newCall = await Call.create({
      ...body,
      userId: user?.id || null,
    })

    console.log('💾 New call saved:', newCall._id)
    return NextResponse.json({ success: true, call: newCall })
  } catch (err: any) {
    console.error('❌ Save Call Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connect()
    const user = await verifyUserToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const calls = await Call.find({ userId: user.id }).sort({ timestamp: -1 })
    return NextResponse.json(calls)
  } catch (err: any) {
    console.error('❌ Fetch Calls Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
