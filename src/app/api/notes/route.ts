// src/app/api/notes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { connect } from '../../../../server/utils/db.js'
import Note from '../../../../server/models/Note.js'
import { sendNoteNotification } from '../../../../server/utils/mailer.js'
import User from '../../../../server/models/User.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/notes
 * Returns all notes for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)

    await connect()
    const docs = await Note.find({ userId: payload.sub }).sort({ createdAt: -1 })

    const notes = docs.map(doc => ({
      id: doc._id.toString(),
      text: doc.text,
      audioUrls:
        doc.audioUrls?.map((url: string) =>
          url.startsWith('http') ? url : `/api/uploads/${url}`
        ) || [],
      callerName: doc.callerName,
      callerEmail: doc.callerEmail,
      callerLocation: doc.callerLocation,
      callerAddress: doc.callerAddress,
      callReason: doc.callReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))

    return NextResponse.json(notes)
  } catch (err) {
    console.error('GET /api/notes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/notes
 * Creates a new note for the logged-in user.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const userId = payload.sub
    const data = await req.json()
    const { text, audioUrls, callerName, callerEmail, callerLocation, callerAddress, callReason } = data

    if (!text) return NextResponse.json({ error: 'Missing note text' }, { status: 400 })

    await connect()
    const dbUser = await User.findById(userId)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    const note = await Note.create({
      userId,
      text,
      audioUrls,
      callerName,
      callerEmail,
      callerLocation,
      callerAddress,
      callReason,
      createdAt: now,
      updatedAt: now,
    })

    const userEmail = dbUser.email
    const subject = `New Note Created by ${callerName || 'Caller'}`
    const body = `
      <p>Hello ${dbUser.name},</p>
      <p>A new note has been created:</p>
      <p>${note.text}</p>
    `

    if (userEmail) {
      await sendNoteNotification({ to: userEmail, subject, html: body })
    }
    if (callerEmail) {
      await sendNoteNotification({
        to: callerEmail,
        subject: 'Copy of Your Submitted Note',
        html: body,
      })
    }

    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    console.error('POST /api/notes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
