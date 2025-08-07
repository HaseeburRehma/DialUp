import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connect } from '../../../../../server/utils/db'
import AnswerAI from '../../../../../server/models/AnswerAi'
import { sendNoteNotification } from '../../../../../server/utils/mailer'

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

  const updatedSession = await AnswerAI.findOneAndUpdate(
    { _id: id, userId: session.user.id },
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
