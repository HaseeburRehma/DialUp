// src/app/api/notes/route.ts

import { NextRequest, NextResponse } from 'next/server'

import { connect } from '../../../../server/utils/db.js'
import Note from '../../../../server/models/Note.js'
import { sendNoteNotification } from '../../../../server/utils/mailer.js'
import User from '../../../../server/models/User.js'
import { getServerSession } from "next-auth"
import { authOptions } from "server/config/authOptions"


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connect()

    const docs = await Note.find({ userId: session.user.id })
      .sort({ createdAt: -1 })

    const notes = docs.map(doc => ({
      id: doc._id.toString(),
      text: doc.text,
      audioUrls: doc.audioUrls?.map((url: string) =>
        url.startsWith("http") ? url : `/api/uploads/${url}`
      ) || [],
      callerName: doc.callerName,
      callerEmail: doc.callerEmail,
      callerLocation: doc.callerLocation,
      callerAddress: doc.callerAddress,
      callReason: doc.callReason,
      folder: doc.folder || "General",
      tags: doc.tags || [],
      summary: doc.summary,
      shareToken: doc.shareToken,
      isShared: doc.isShared,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))

    return NextResponse.json(notes)
  } catch (err) {
    console.error("GET /api/notes error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



/**
 * POST /api/notes
 * Creates a new note for the logged-in user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const {
      text,
      audioUrls,
      callerName,
      callerEmail,
      callerLocation,
      callerAddress,
      callReason,
      folder,
      tags,
      summary,
      shareToken,
      isShared,
    } = data

    if (!text) {
      return NextResponse.json({ error: "Missing note text" }, { status: 400 })
    }

    await connect()

    const dbUser = await User.findById(session.user.id)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const note = await Note.create({
      userId: session.user.id,
      text,
      audioUrls,
      callerName,
      callerEmail,
      callerLocation,
      callerAddress,
      callReason,
      folder: folder || "General",
      tags: tags || [],
      summary,
      shareToken,
      isShared: isShared || false,
      createdAt: now,
      updatedAt: now,
    })

    // Email notifications (unchanged)
    if (dbUser.email) {
      await sendNoteNotification({
        to: dbUser.email,
        subject: `New Note Created by ${callerName || "Caller"}`,
        html: `<p>${note.text}</p>`,
      })
    }

    if (callerEmail) {
      await sendNoteNotification({
        to: callerEmail,
        from: process.env.SMTP_USER,
        subject: "Copy of Your Submitted Note",
        html: `<p>${note.text}</p>`,
      })
    }

    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    console.error("POST /api/notes error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

