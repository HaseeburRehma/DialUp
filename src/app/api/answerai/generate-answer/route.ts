// src/app/api/answerai/generate-answer/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'server/config/authOptions.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { question, context, position, company } = await req.json()
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  try {
    const answer = await generateAnswer({ question, context, position, company })
    return NextResponse.json({
      answer,
      confidence: 0.9,
      generatedAt: Date.now(),
      isAiGenerated: true
    })
  } catch (error) {
    console.error('Answer generation error:', error)
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
  }
}

interface PromptInput {
  question: string
  context?: string
  position?: string
  company?: string
}

async function generateAnswer({ question, context, position, company }: PromptInput): Promise<string> {
  const cleanedContext = context?.trim() && context.trim().length > 10 ? context.trim() : ''
  const prompt = [
    `You're an expert career assistant helping someone prepare for a job interview.`,
    position && `Role: ${position}`,
    company && `Company: ${company}`,
    cleanedContext && `Context: ${cleanedContext}`,
    '',
    `Question: ${question}`,
    `Give a relevant, structured, concise response.`
  ].filter(Boolean).join('\n')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'sk-or-v158b52a65c4a359a89665321240e6ffc8239956b3b1dbbcc9c9d8aeaee865c393'}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
      'X-Title': 'AnswerAI Interview Assistant'
    },
    body: JSON.stringify({
      model: 'kwaipilot/kat-coder-pro:free',
      messages: [
        { role: 'system', content: 'You are a helpful and concise AI assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('OpenRouter API error:', res.status, errorText)
    throw new Error(`OpenRouter API returned ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || 'Could not generate answer.'
}
