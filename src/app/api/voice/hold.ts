// src/app/api/voice/hold.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const twiml = new VoiceResponse()

  // Play Twilio’s built-in hold music loop
  twiml.play('http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.mp3')

  res.setHeader('Content-Type', 'text/xml')
  res.status(200).send(twiml.toString())
}
