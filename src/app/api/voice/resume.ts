import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const twiml = new VoiceResponse()

  // Redirect back to your main call flow (e.g. your agent)
  twiml.dial().client('agent')

  res.setHeader('Content-Type', 'text/xml')
  res.status(200).send(twiml.toString())
}
