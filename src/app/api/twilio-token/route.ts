// src/app/api/twilio-token/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  try {
    const identity = "web_dialer_user" // must match your client identity

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,     // ✅ OK
      process.env.TWILIO_API_KEY_SID!,     // ✅ use _SID
      process.env.TWILIO_API_KEY_SECRET!,  // ✅ use _SECRET
      { identity }
    )

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!
    })

    token.addGrant(voiceGrant)

    return NextResponse.json({ token: token.toJwt() })
  } catch (err: any) {
    console.error("❌ Token generation failed:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

