import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy-key-for-build',
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceai.app',
        'X-Title': 'VoiceAI Notes',
    },
})

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { text } = await req.json()
        if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceai.app',
                'X-Title': 'VoiceAI Notes',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that summarizes voice notes. Provide a concise summary of the following text, highlighting key points and action items if any.',
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
                max_tokens: 500,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenRouter API error:', response.status, errorText)
            return NextResponse.json({ error: `OpenRouter API error: ${response.status}` }, { status: 500 })
        }

        const data = await response.json()
        const summary = data.choices[0].message.content

        return NextResponse.json({ summary })
    } catch (error) {
        console.error('AI Summarization error:', error)
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }
}
