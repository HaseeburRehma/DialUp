// src/app/api/twilio-token/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  try {
    const identity = "web_dialer_user" // consistent client identity

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

    return NextResponse.json(
      { token: token.toJwt(), identity },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    )
  } catch (err: any) {
    console.error("❌ Token generation failed:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
