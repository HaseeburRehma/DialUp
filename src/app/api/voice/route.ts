// src/app/api/voice/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const { VoiceResponse } = twilio.twiml

export async function POST(req: Request) {
  const body = await req.formData() // Twilio sends x-www-form-urlencoded
  const to = body.get('To')?.toString()

  const twiml = new VoiceResponse()
  const dial = twiml.dial()

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
