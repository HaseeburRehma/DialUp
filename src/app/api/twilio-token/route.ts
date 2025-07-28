// src/app/api/twilio-token/route.ts
import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { jwt as TwilioJwt } from "twilio"

const { AccessToken } = TwilioJwt
const VoiceGrant = AccessToken.VoiceGrant

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  // check session
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const identity = session.user.id
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  )

  token.addGrant(
    new VoiceGrant({
      incomingAllow: true,
      pushCredentialSid: process.env.TWILIO_PUSH_CREDENTIAL_SID,
    })
  )

  return res.status(200).json({ token: token.toJwt() })
}
