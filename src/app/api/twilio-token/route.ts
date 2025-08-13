// src/app/api/twilio-token/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/shared/authOptions";

import { jwt as TwilioJwt } from "twilio"

const { AccessToken } = TwilioJwt
const VoiceGrant = AccessToken.VoiceGrant

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
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

  return NextResponse.json({ token: token.toJwt() })
}
