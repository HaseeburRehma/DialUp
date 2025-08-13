import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/shared/authOptions";

import { connect } from '../../../../../server/utils/db.js';
import AnswerAI from '../../../../../server/models/AnswerAi.js';
import { sendNoteNotification } from '../../../../../server/utils/mailer.js';
import User from '../../../../../server/models/User.js';


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: any) {
  const { id } = context.params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

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
    transcript = '',
    audioUrls = [],
    status = 'active',
    totalDuration = 0,
  } = data

  await connect()

  const processedAnswers = answers.map((answer: any) => ({
    ...answer,
    generatedAt: typeof answer.generatedAt === 'string'
      ? new Date(answer.generatedAt).getTime()
      : answer.generatedAt || Date.now()
  }))
  // Optional: ensure user exists in DB
  const dbUser = await User.findById(session.user.id)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updatedSession = await AnswerAI.findOneAndUpdate(
    { _id: id, userId: dbUser._id, },
    {
      sessionName,
      interviewerName,
      candidateName,
      candidateEmail,
      position,
      company,
      questions,
      answers: processedAnswers,
      audioUrls,
      transcript,
      status,
      totalDuration,
      updatedAt: new Date(),
    },
    { new: true }
  )

  if (!updatedSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const subject = `AnswerAI Session Updated: ${sessionName}`
  const html = `<p>The AnswerAI session for <strong>${candidateName}</strong> has been updated.</p>`

  if (session.user.email) {
    await sendNoteNotification({ to: session.user.email, subject, html })
  }

  if (candidateEmail) {
    await sendNoteNotification({ to: candidateEmail, subject: 'Your interview session was updated', html })
  }

  return NextResponse.json({
    ...updatedSession.toObject(),
    id: updatedSession._id.toString()
  })
}
