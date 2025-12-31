// src/app/api/notes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { connect } from '../../../../../server/utils/db.js'
import Note from '../../../../../server/models/Note.js'
import { sendNoteNotification } from '../../../../../server/utils/mailer.js'
import User from '../../../../../server/models/User.js'
import { getToken } from "next-auth/jwt"
const { processTranscript } = require('../../../../../server/utils/ai-processor')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    await connect()

    const { text, folder, tags, isShared, summary, callReason, callerName, audioUrls } = data

    // Auto-process with AI if text is present and long enough
    let aiInsights = null;
    if (text && text.length > 20) {
      try {
        aiInsights = await processTranscript(text);
      } catch (aiErr) {
        console.error('⚠️ AI Insight generation failed for note:', aiErr);
      }
    }

    const updatePayload: any = {
      ...(text !== undefined && { text }),
      ...(folder !== undefined && { folder }),
      ...(tags !== undefined && { tags }),
      ...(isShared !== undefined && { isShared }),
      ...(summary !== undefined && { summary }),
      ...(callReason !== undefined && { callReason }),
      ...(callerName !== undefined && { callerName }),
      ...(audioUrls !== undefined && { audioUrls }),
      updatedAt: new Date()
    }

    if (aiInsights) {
      updatePayload.sentiment = aiInsights.sentiment;
      updatePayload.extractedTasks = aiInsights.tasks;
      if (aiInsights.summary && !updatePayload.summary) {
        updatePayload.summary = aiInsights.summary;
      }
    }

    const note = await Note.findOneAndUpdate(
      { _id: (await params).id, userId: token.id || token.sub },
      updatePayload,
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connect()
    const result = await Note.deleteOne({ _id: (await params).id, userId: token.id || token.sub })
    if (result.deletedCount === 0)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
