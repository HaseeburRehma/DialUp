// src/app/api/answerai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connect } from '../../../../server/utils/db.js'
import AnswerAI from '../../../../server/models/AnswerAi.js'
import { sendNoteNotification } from '../../../../server/utils/mailer.js'
import User from '../../../../server/models/User.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/answerai
 * Returns all AnswerAI sessions for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = token.id || token.sub
    await connect()

    const docs = await AnswerAI.find({ userId }).sort({ createdAt: -1 })

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
  } catch (err) {
    console.error('GET /api/answerai error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/answerai
 * Creates a new AnswerAI session.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      transcript = '',
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
    const dbUser = await User.findById(userId)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()

    const processedAnswers = answers.map((answer: any) => ({
      ...answer,
      generatedAt: typeof answer.generatedAt === 'string'
        ? new Date(answer.generatedAt).getTime()
        : answer.generatedAt || Date.now()
    }))

    const answerAISession = await AnswerAI.create({
      userId: dbUser._id,
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
      createdAt: now,
      updatedAt: now,
    })

    // Send notifications
    const userEmail = dbUser.email
    const subject = `New AnswerAI Session: ${sessionName}`
    const body = `
      <p>Hello ${dbUser.name},</p>
      <p>A new AnswerAI interview session has been created:</p>
      <ul>
        <li><strong>Session:</strong> ${sessionName}</li>
        <li><strong>Candidate:</strong> ${candidateName}</li>
        <li><strong>Position:</strong> ${position}</li>
        <li><strong>Company:</strong> ${company}</li>
        <li><strong>Interviewer:</strong> ${interviewerName || 'N/A'}</li>
        <li><strong>Created At:</strong> ${now.toLocaleString()}</li>
        <li><strong>Questions:</strong> ${questions.length}</li>
        <li><strong>Answers:</strong> ${processedAnswers.length}</li>
      </ul>
      <p>You can now start recording and getting AI-powered answers for interview questions.</p>
      <p>Best regards,<br>AnswerAI Team</p>
    `

    if (userEmail) {
      await sendNoteNotification({ to: userEmail, subject, html: body })
    }

    if (candidateEmail) {
      await sendNoteNotification({
        to: candidateEmail,
        subject: `Interview Session Created: ${sessionName}`,
        html: body,
      })
    }

    return NextResponse.json({
      ...answerAISession.toObject(),
      id: answerAISession._id.toString()
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/answerai error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/answerai
 * Updates an existing AnswerAI session.
 */
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = token.id || token.sub
    const data = await req.json()
    const { sessionId, questions = [], answers = [], status, totalDuration } = data

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    await connect()

    const processedAnswers = answers.map((answer: any) => ({
      ...answer,
      generatedAt: typeof answer.generatedAt === 'string'
        ? new Date(answer.generatedAt).getTime()
        : answer.generatedAt || Date.now()
    }))

    const updateData: any = { updatedAt: new Date() }
    if (questions.length) updateData.questions = questions
    if (processedAnswers.length) updateData.answers = processedAnswers
    if (status) updateData.status = status
    if (totalDuration !== undefined) updateData.totalDuration = totalDuration

    const updatedSession = await AnswerAI.findOneAndUpdate(
      { _id: sessionId, userId },
      updateData,
      { new: true }
    )

    if (!updatedSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...updatedSession.toObject(),
      id: updatedSession._id.toString()
    })
  } catch (err) {
    console.error('PUT /api/answerai error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
