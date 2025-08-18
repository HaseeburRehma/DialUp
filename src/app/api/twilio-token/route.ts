// src/app/api/twilio-token/route.ts
import { NextApiRequest, NextApiResponse } from "next"
import twilio from "twilio"

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const identity = "web_dialer_user" // 🔥 must match your dial.client()

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  )

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWIML_APP_SID!,
    incomingAllow: true
  })

  token.addGrant(voiceGrant)

  res.status(200).json({ token: token.toJwt() })
}
