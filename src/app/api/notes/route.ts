import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { connect } from '../../../../server/utils/db'
import Note from '../../../../server/models/Note'
import { sendNoteNotification } from '../../../../server/utils/mailer'
import User from '../../../../server/models/User'    // ← your User model

// Force this route to be dynamic and run in Node.js runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/notes
 * Returns all notes for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 })
  }

  await connect()
  const docs = await Note.find({ userId: session.user.id }).sort({ createdAt: -1 })

  const notes = docs.map(doc => ({
    id:            doc._id.toString(),     // ← expose an `id` field
    text:          doc.text,
    audioUrls:     doc.audioUrls,
    callerName:    doc.callerName,
    callerEmail:   doc.callerEmail,
    callerLocation:doc.callerLocation,
    callerAddress: doc.callerAddress,
    callReason:    doc.callReason,
    createdAt:     doc.createdAt,
    updatedAt:     doc.updatedAt,
  }))

  return NextResponse.json(notes)
}
/**
 * POST /api/notes
 * Creates a new note with provided details and emails both the user and caller.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const data = await req.json()
  const { text, audioUrls, callerName, callerEmail, callerLocation, callerAddress, callReason } = data
  if (!text) {
    return NextResponse.json({ error: 'Missing note text' }, { status: 400 })
  }

  await connect()
  const now = new Date()
   // ← Lookup the Mongo _id for this user
  const dbUser = await User.findOne({ email: session.user.email })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const note = await Note.create({
    userId: session.user.id,
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

  // Send notification emails
  const userEmail = session.user.email
  const subject = `New Note Created by ${callerName || 'Caller'}`
  const body = `
    <p>Hello ${session.user.name},</p>
    <p>A new note has been created with the following details:</p>
    <ul>
      <li><strong>Note Text:</strong> ${note.text}</li>
      ${callerName ? `<li><strong>Caller Name:</strong> ${callerName}</li>` : ''}
      ${callerEmail ? `<li><strong>Caller Email:</strong> ${callerEmail}</li>` : ''}
      ${callerLocation ? `<li><strong>Caller Location:</strong> ${callerLocation}</li>` : ''}
      ${callerAddress ? `<li><strong>Caller Address:</strong> ${callerAddress}</li>` : ''}
      ${callReason ? `<li><strong>Call Reason:</strong> ${callReason}</li>` : ''}
      <li><strong>Created At:</strong> ${now.toLocaleString()}</li>
    </ul>
    <p>Thank you,</p>
    <p>Your Notes App</p>
  `

  if (userEmail) {
    await sendNoteNotification({
      to: userEmail,
      subject,
      html: body,
    })
  }
  if (callerEmail) {
    await sendNoteNotification({
      to: callerEmail,
      subject: 'Copy of Your Submitted Note',
      html: body,
    })
  }

  return NextResponse.json(note, { status: 201 })
}
