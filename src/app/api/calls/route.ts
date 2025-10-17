
// src/app/api/calls/route.ts

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
    const body = await req.json()

    // Try to attach logged-in user if available
    let userId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        userId = session.user.id
        console.log('✅ Authenticated call from user:', userId)
      } else {
        console.log('⚠️ No authenticated user for this call (fallback mode)')
      }
    } catch (err) {
      console.log('⚠️ Session fetch failed, saving anonymously')
    }

    const newCall = await Call.create({
      ...body,
      userId: userId || body.userId || null,
    })

    console.log('💾 New call saved:', newCall._id)
    return NextResponse.json({ success: true, call: newCall })
  } catch (err: any) {
    console.error('❌ Save Call Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Fetch call history for the logged in user
 */
export async function GET() {
  try {
    await connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const calls = await Call.find({ userId: session.user.id }).sort({ timestamp: -1 })
    return NextResponse.json(calls)
  } catch (err: any) {
    console.error('❌ Fetch Calls Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
