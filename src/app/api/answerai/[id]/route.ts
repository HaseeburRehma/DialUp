// src/app/api/answerai/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from 'server/config/authOptions.js'

import { connect } from '../../../../../server/utils/db.js';
import AnswerAI from '../../../../../server/models/AnswerAi.js';
import { sendNoteNotification } from '../../../../../server/utils/mailer.js';
import User from '../../../../../server/models/User.js';
import { verifyUserToken } from '../../../../../server/utils/verifyToken.js'


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await verifyUserToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connect()
  const docs = await AnswerAI.find({ userId: user.id }).sort({ createdAt: -1 })

  const sessions = docs.map(doc => ({
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
    status: doc.status,
    totalDuration: doc.totalDuration,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }))

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const user = await verifyUserToken(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const data = await req.json()
  const { sessionName, interviewerName, candidateName, candidateEmail, position, company, questions = [], answers = [], audioUrls = [], transcript = '', status = 'active', totalDuration = 0 } = data

  if (!sessionName || !candidateName || !position || !company) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await connect()
  const dbUser = await User.findById(user.id)
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
    audioUrls,
    status,
    totalDuration,
    createdAt: now,
    updatedAt: now,
  })

  const subject = `New AnswerAI Session: ${sessionName}`
  const html = `<p>New AnswerAI session created by ${dbUser.name}</p>`
  if (dbUser.email) await sendNoteNotification({ to: dbUser.email, subject, html })
  if (candidateEmail) await sendNoteNotification({ to: candidateEmail, subject, html })

  return NextResponse.json({ ...answerAISession.toObject(), id: answerAISession._id.toString() }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await verifyUserToken(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const data = await req.json()
  const { sessionId, questions = [], answers = [], status, totalDuration } = data
  if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

  await connect()
  const updateData: any = { updatedAt: new Date() }
  if (questions.length) updateData.questions = questions
  if (answers.length) updateData.answers = answers
  if (status) updateData.status = status
  if (totalDuration !== undefined) updateData.totalDuration = totalDuration

  const updated = await AnswerAI.findOneAndUpdate({ _id: sessionId, userId: user.id }, updateData, { new: true })
  if (!updated) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  return NextResponse.json({ ...updated.toObject(), id: updated._id.toString() })
}