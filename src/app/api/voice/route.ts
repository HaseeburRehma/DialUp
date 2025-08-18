// src/app/api/voice/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const { VoiceResponse } = twilio.twiml

// 👉 For debugging in browser
export async function GET() {
  const twiml = new VoiceResponse()
  twiml.say({ voice: 'alice' }, 'Your TwiML voice endpoint is working!')

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// 👉 For Twilio Voice webhook
export async function POST(req: Request) {
  const body = await req.formData() // Twilio sends x-www-form-urlencoded
  const to = body.get('To')?.toString()

  const twiml = new VoiceResponse()
  const dial = twiml.dial({ callerId: process.env.TWILIO_CALLER_ID }) // your Twilio phone number

  if (to) {
    if (/^\+?\d+$/.test(to)) {
      dial.number(to)
    } else {
      dial.client(to)
    }
  } else {
    dial.client('web_dialer_user')
  }

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
