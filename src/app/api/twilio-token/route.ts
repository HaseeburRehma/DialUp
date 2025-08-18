// src/app/api/twilio-token/route.ts
import { NextResponse } from "next/server"
import { jwt as TwilioJwt } from "twilio"
import { authOptions } from 'server/config/authOptions.js'
import { getServerSession } from "next-auth"

const { AccessToken } = TwilioJwt
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const identity = session.user.email || session.user.id || "guest_user"

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { identity }
    )

    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
        incomingAllow: true,
      })
    )

    return NextResponse.json({ token: token.toJwt() })
  } catch (err: any) {
    console.error("❌ Token error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
