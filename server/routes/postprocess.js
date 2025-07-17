// server/api/postprocess.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default defineEventHandler(async (event) => {
  const { text, prompt } = await readBody<{ text: string; prompt: string }>(event)

  // 1) call the LLM
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user',   content: text },
    ],
  })

  // 2) guard against missing choices
  if (!res.choices || res.choices.length === 0) {
    throw createError({ statusCode: 502, message: 'No completion returned from OpenAI' })
  }

  // 3) guard against missing message or content
  const choice = res.choices[0]
  const content = choice.message?.content
  if (!content) {
    throw createError({ statusCode: 502, message: 'OpenAI response missing message content' })
  }

  // 4) return trimmed text
  return content.trim()
})
