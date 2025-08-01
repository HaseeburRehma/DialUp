import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { connect } from '../../../../server/utils/db'
import AnswerAI from '../../../../server/models/AnswerAi'
import { sendNoteNotification } from '../../../../server/utils/mailer'
import User from '../../../../server/models/User'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/answerai
 * Returns all AnswerAI sessions for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 })
  }

  await connect()
  const docs = await AnswerAI.find({ userId: session.user.id }).sort({ createdAt: -1 })

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

/**
 * POST /api/answerai
 * Creates a new AnswerAI session.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
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
    audioUrls = [],
    status = 'active',
    totalDuration = 0
  } = data

  if (!sessionName || !candidateName || !position || !company) {
    return NextResponse.json({ 
      error: 'Missing required fields: sessionName, candidateName, position, company' 
    }, { status: 400 })
  }

  await connect()
  const now = new Date()

  const dbUser = await User.findOne({ email: session.user.email })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const answerAISession = await AnswerAI.create({
    userId: session.user.id,
    sessionName,
    interviewerName,
    candidateName,
    candidateEmail,
    position,
    company,
    questions,
    answers,
    audioUrls,
    status,
    totalDuration,
    createdAt: now,
    updatedAt: now,
  })

  // Send notification emails
  const userEmail = session.user.email
  const subject = `New AnswerAI Session: ${sessionName}`
  const body = `
    <p>Hello ${session.user.name},</p>
    <p>A new AnswerAI interview session has been created:</p>
    <ul>
      <li><strong>Session:</strong> ${sessionName}</li>
      <li><strong>Candidate:</strong> ${candidateName}</li>
      <li><strong>Position:</strong> ${position}</li>
      <li><strong>Company:</strong> ${company}</li>
      <li><strong>Interviewer:</strong> ${interviewerName || 'N/A'}</li>
      <li><strong>Created At:</strong> ${now.toLocaleString()}</li>
    </ul>
    <p>You can now start recording and getting AI-powered answers for interview questions.</p>
    <p>Best regards,</p>
    <p>AnswerAI Team</p>
  `

  if (userEmail) {
    await sendNoteNotification({
      to: userEmail,
      subject,
      html: body,
    })
  }

  if (candidateEmail) {
    await sendNoteNotification({
      to: candidateEmail,
      subject: `Interview Session Created: ${sessionName}`,
      html: body,
    })
  }

  return NextResponse.json(answerAISession, { status: 201 })
}