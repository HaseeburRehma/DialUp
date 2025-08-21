import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { To } = req.body

  const twiml = new VoiceResponse()

  if (To) {
    // If number starts with +, treat as PSTN
    if (To.match(/^\+\d+/)) {
      const dial = twiml.dial({ callerId: process.env.TWILIO_CALLER_ID })
      dial.number(To)
    } else {
      // Otherwise, dial a client identity
      const dial = twiml.dial()
      dial.client(To)
    }
  } else {
    twiml.say('No destination provided')
  }

  res.setHeader('Content-Type', 'text/xml')
  res.status(200).send(twiml.toString())
}
