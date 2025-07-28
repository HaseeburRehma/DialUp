// app/api/twilio-token.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { jwt as TwilioJwt } from 'twilio'
const { AccessToken } = TwilioJwt
const VoiceGrant = AccessToken.VoiceGrant

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: replace with your auth check (NextAuth, session, etc.)
  if (!req.cookies.session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const identity = /* derive from user session */ 'user-id'
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  )

  token.addGrant(
    new VoiceGrant({
      incomingAllow: true,
      pushCredentialSid: process.env.TWILIO_PUSH_CREDENTIAL_SID
    })
  )

  res.status(200).json({ token: token.toJwt() })
}
