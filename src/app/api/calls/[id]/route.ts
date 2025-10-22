// src/app/api/calls/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connect()
    const body = await req.json()
    const updated = await Call.findByIdAndUpdate(params.id, body, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ Update call error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
