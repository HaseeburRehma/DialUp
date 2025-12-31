// src/app/api/twilio-token/route.ts
import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const tokenData = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!tokenData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = (tokenData.email || tokenData.name || "user") as string;
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
    TWILIO_API_KEY_SID!,     // ✅ match env name
    TWILIO_API_KEY_SECRET!,  // ✅ match env name
    { identity }
  );

  token.addGrant(
    new VoiceGrant({
      outgoingApplicationSid: TWILIO_TWIML_APP_SID!, // ✅ correct var
      incomingAllow: true,
    })
  );

  return NextResponse.json({
    token: token.toJwt(),
    identity,
  });
}

