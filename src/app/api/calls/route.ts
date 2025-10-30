
// src/app/api/calls/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../server/utils/db'
import Call from '../../../../server/models/Call'
import { requireAuth } from '../../../../server/utils/requireAuth.js'
import { getToken } from "next-auth/jwt"

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await connect()
    const user = await requireAuth(req)
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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await connect()
    const user = await requireAuth(req)
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
