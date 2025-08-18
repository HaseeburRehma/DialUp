// src/app/api/twilio-token/route.ts
import { NextResponse } from "next/server"
import { jwt as TwilioJwt } from "twilio"

const { AccessToken } = TwilioJwt
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  try {
    const identity = "web_dialer_user" // ideally from session
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!,   // make sure you use SID
      process.env.TWILIO_API_KEY_SECRET!,
      { identity }
    )

    token.addGrant(
      new VoiceGrant({
        incomingAllow: true,
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      })
    )

    return NextResponse.json({ token: token.toJwt() })
  } catch (err: any) {
    console.error("❌ Token error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
