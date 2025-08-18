// src/app/api/voice/route.ts
import { NextApiRequest, NextApiResponse } from "next"
import twilio from "twilio"

const { VoiceResponse } = twilio.twiml

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const twiml = new VoiceResponse()

  // Who is being called? Use "To" param if present
  const to = req.body.To

  if (to) {
    const dial = twiml.dial()
    // If the "To" looks like a phone number, dial out
    if (/^\+?\d+$/.test(to)) {
      dial.number(to)
    } else {
      // Otherwise assume it's a Client identity
      dial.client(to)
    }
  } else {
    // Default: dial a known client identity
    const dial = twiml.dial()
    dial.client("web_dialer_user")
  }

  res.setHeader("Content-Type", "text/xml")
  res.status(200).send(twiml.toString())
}

