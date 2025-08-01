import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
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
    ]
        .filter(Boolean)
        .join('\n')

    const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'mistral',
            prompt,
            temperature: 0.6,
            max_tokens: 300,
            stream: false
        })
    })


    if (!res.ok) {
        const errorText = await res.text()
        console.error('Ollama API error:', res.status, errorText)
        throw new Error(`Ollama API returned ${res.status}`)
    }

    const data = await res.json()
    return data.response?.trim() || 'Could not generate answer.'
}
