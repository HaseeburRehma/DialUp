// src/app/api/twilio-token/route.ts
import { NextRequest } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(req: NextRequest) {
  const twiml = new VoiceResponse()

  // Route incoming calls to your web client identity
  twiml.dial().client("web_dialer_user")

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  })
}
