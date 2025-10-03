// src/app/api/calls/route.ts
// Unchanged - already solid for CRUD on calls.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connect } from '../../../../server/utils/db'
import Call from '../../../../server/models/Call'
import { authOptions } from 'server/config/authOptions.js'

/**
 * Save a new call record
 */
export async function POST(req: NextRequest) {
  try {
    await connect()

    // Get logged in user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const newCall = await Call.create({
      ...body,
      userId: session.user.id
    })

    return NextResponse.json({ success: true, call: newCall })
  } catch (err: any) {
    console.error('❌ Save Call Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Fetch call history for the logged in user
 */
export async function GET(req: NextRequest) {
  try {
    await connect()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const skip = (page - 1) * limit

    const [calls, total] = await Promise.all([
      Call.find({ userId: session.user.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Call.countDocuments({ userId: session.user.id })
    ])

    return NextResponse.json({ calls, total, page, limit })
  } catch (err: any) {
    console.error('❌ Fetch Calls Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
