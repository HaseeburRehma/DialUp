// server/routes/postprocess.ts (or move to /app/api/postprocess/route.ts for proper routing)

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, prompt } = body as { text: string; prompt: string }

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
    })

    const content = res.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'OpenAI response missing message content' }, { status: 502 })
    }

    return NextResponse.json({ result: content.trim() })
  } catch (err) {
    console.error('Postprocess Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
