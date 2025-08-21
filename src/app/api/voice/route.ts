// src/app/api/voice/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { connect } from '../../../../server/utils/db.js';
import Call from '../../../../server/models/Call';

declare global {
  // eslint-disable-next-line no-var
  var __OMNIDIM_LAST_EVENT__: any
}

const { VoiceResponse } = twilio.twiml

// Normalize numbers to E.164
function normalizeNumber(num: string): string {
  let digits = num.replace(/\D/g, '')
  if (num.startsWith('+')) return num
  if (digits.length === 10) return '+1' + digits // default US
  return '+' + digits
}

export async function GET() {
  const vr = new VoiceResponse()
  vr.say({ voice: 'alice' }, '✅ Your Twilio voice endpoint is working')
  return new NextResponse(vr.toString(), { status: 200, headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  // 🟢 Twilio Voice Webhook
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const vr = new VoiceResponse()

    // Stream caller audio to Omnidim AI
    const connect = vr.connect()
    connect.stream({
      url: process.env.OMNIDIM_AI_ENDPOINT!, // Omnidim listens here
      track: 'both_tracks',
    })

    return new NextResponse(vr.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Access-Control-Allow-Origin': '*',  // 🔑 Omnidim needs this
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  // 🟡 Omnidim AI → JSON events
  if (contentType.includes('application/json')) {
    const body = await req.json()
    console.log('🤖 Omnidim AI Event:', body)

    // Save transcription + reply for SSE
    globalThis.__OMNIDIM_LAST_EVENT__ = body

    // If agent replied, create TwiML to inject back to call
    if (body.agent_reply) {
      try {
        await connect()
        await Call.findOneAndUpdate(
          { number: body.callerNumber, status: 'completed' }, // match latest
          { $push: { agentReplies: body.agent_reply } },
          { sort: { timestamp: -1 } }
        )
      } catch (err) {
        console.error('❌ Failed to save agent reply:', err)
      }
      const vr = new VoiceResponse()
      vr.say({ voice: 'Polly.Joanna' }, body.agent_reply) // can change voice
      return new NextResponse(vr.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })

    }

    return NextResponse.json({ status: 'ok' })
  }

  return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
}


