// src/app/api/notes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { connect } from '../../../../../server/utils/db.js'
import Note from '../../../../../server/models/Note.js'
import { sendNoteNotification } from '../../../../../server/utils/mailer.js'
import User from '../../../../../server/models/User.js'
import { getToken } from "next-auth/jwt"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    await connect()

    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId: token.id },
      data,
      { new: true }
    )

    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    return NextResponse.json(note)
  } catch (err) {
    console.error('PATCH /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub

    await connect()
    const result = await Note.deleteOne({ _id: params.id, userId })
    if (result.deletedCount === 0)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
