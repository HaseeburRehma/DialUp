// src/app/api/answerai/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connect } from '../../../../../server/utils/db.js'
import AnswerAI from '../../../../../server/models/AnswerAi.js'
import { sendNoteNotification } from '../../../../../server/utils/mailer.js'
import User from '../../../../../server/models/User.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/answerai/[id]
 * Returns all sessions for the authenticated user (or a specific one if needed).
 */
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = await Promise.resolve(context)
    const { id } = params

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!id) return NextResponse.json({ error: 'Missing ID param' }, { status: 400 })

    const userId = token.id || token.sub
    await connect()

    const doc = await AnswerAI.findOne({ _id: id, userId })
    if (!doc) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const session = {
      id: doc._id.toString(),
      sessionName: doc.sessionName,
      interviewerName: doc.interviewerName,
      candidateName: doc.candidateName,
      candidateEmail: doc.candidateEmail,
      position: doc.position,
      company: doc.company,
      questions: doc.questions,
      answers: doc.answers,
      audioUrls: doc.audioUrls,
      transcript: doc.transcript,
      status: doc.status,
      totalDuration: doc.totalDuration,
      scorecard: doc.scorecard,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }

    return NextResponse.json(session)
  } catch (err) {
    console.error('GET /api/answerai/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/answerai/[id]
 * Creates a new AnswerAI session for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.id || token.sub
    const data = await req.json()
    const {
      sessionName,
      interviewerName,
      candidateName,
      candidateEmail,
      position,
      company,
      questions = [],
      answers = [],
      audioUrls = [],
      transcript = '',
      status = 'active',
      totalDuration = 0,
      scorecard = null
    } = data

    if (!sessionName || !candidateName || !position || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connect()
    const dbUser = await User.findById(userId)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    const answerAISession = await AnswerAI.create({
      userId: dbUser._id,
      sessionName,
      interviewerName,
      candidateName,
      candidateEmail,
      position,
      company,
      questions,
      answers,
      transcript,
      scorecard,
      audioUrls,
      status,
      totalDuration,
      createdAt: now,
      updatedAt: now,
    })

    const subject = `New AnswerAI Session: ${sessionName}`
    const html = `<p>New AnswerAI session created by ${dbUser.name}</p>`

    if (dbUser.email) {
      await sendNoteNotification({ to: dbUser.email, subject, html })
    }

    if (candidateEmail) {
      await sendNoteNotification({ to: candidateEmail, subject, html })
    }

    return NextResponse.json({
      ...answerAISession.toObject(),
      id: answerAISession._id.toString(),
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/answerai/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/answerai/[id]
 * Updates an existing AnswerAI session.
 */
/**
 * PUT /api/answerai/[id]
 * Updates an existing AnswerAI session.
 */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = await Promise.resolve(context) // ✅ Fix: ensure params awaited
    const { id } = params

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing ID param' }, { status: 400 })
    }

    const userId = token.id || token.sub
    const data = await req.json()

    await connect()

    const {
      questions = [],
      answers = [],
      status,
      totalDuration,
      audioUrls,
      transcript,
      position,
      company,
      scorecard
    } = data

    const updateData: any = { updatedAt: new Date() }

    if (questions) updateData.questions = questions
    if (answers) updateData.answers = answers
    if (status) updateData.status = status
    if (totalDuration !== undefined) updateData.totalDuration = totalDuration
    if (audioUrls?.length) updateData.audioUrls = audioUrls
    if (transcript) updateData.transcript = transcript
    if (position) updateData.position = position
    if (company) updateData.company = company
    if (scorecard !== undefined) updateData.scorecard = scorecard

    const updated = await AnswerAI.findOneAndUpdate(
      { _id: id, userId }, // ✅ Fix: use `id` not `sessionId`
      updateData,
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...updated.toObject(),
      id: updated._id.toString(),
    })
  } catch (err) {
    console.error('PUT /api/answerai/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

