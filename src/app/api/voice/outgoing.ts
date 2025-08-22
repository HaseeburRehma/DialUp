// src/app/api/voice/outgoing.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { To } = req.body
  const twiml = new VoiceResponse()

  if (To) {
    if (/^\+\d+/.test(To)) {
      // PSTN call
      const callerId = process.env.TWILIO_CALLER_ID
      if (!callerId) {
        console.error('❌ Missing TWILIO_CALLER_ID in env')
        twiml.say('Configuration error: Caller ID not set')
      } else {
        const dial = twiml.dial({ callerId })
        dial.number(To)
      }
    } else {
      // Client-to-client
      const dial = twiml.dial()
      dial.client(To)
    }
  } else {
    twiml.say('No destination provided')
  }

  res.setHeader('Content-Type', 'text/xml')
  res.status(200).send(twiml.toString())
}
