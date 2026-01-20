// src/app/api/notes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "server/config/authOptions"

import { connect } from "../../../../../server/utils/db.js"
import Note from "../../../../../server/models/Note.js"
import User from "../../../../../server/models/User.js"
import { sendNoteNotification } from "../../../../../server/utils/mailer.js"

const { processTranscript } = require("../../../../../server/utils/ai-processor")

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PATCH /api/notes/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    await connect()

    const {
      text,
      folder,
      tags,
      isShared,
      summary,
      callReason,
      callerName,
      audioUrls,
    } = data

    // Auto-process with AI
    let aiInsights = null
    if (text && text.length > 20) {
      try {
        aiInsights = await processTranscript(text)
      } catch (aiErr) {
        console.error("⚠️ AI Insight generation failed:", aiErr)
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
      updatedAt: new Date(),
    }

    if (aiInsights) {
      updatePayload.sentiment = aiInsights.sentiment
      updatePayload.extractedTasks = aiInsights.tasks
      if (aiInsights.summary && !updatePayload.summary) {
        updatePayload.summary = aiInsights.summary
      }
    }

    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      updatePayload,
      { new: true }
    )

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (err) {
    console.error("PATCH /api/notes/[id] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/notes/[id]
 */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connect()

    const result = await Note.deleteOne({
      _id: params.id,
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
