// src/app/api/test-token/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    TWILIO_TWIML_APP_SID,
  } = process.env;

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID!,
    TWILIO_API_KEY_SID!,
    TWILIO_API_KEY_SECRET!,
    { identity: "test_client" }
  );

  token.addGrant(new VoiceGrant({
    outgoingApplicationSid: TWILIO_TWIML_APP_SID!,
    incomingAllow: true,
  }));

  return NextResponse.json({
    token: token.toJwt(),
    identity: "test_client",
  });
}

