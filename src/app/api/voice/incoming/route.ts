// src/app/api/voice/incoming/route.ts

import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
  try {
    // Parse Twilio form POST
    const formData = await req.formData();
    const from = formData.get("From");
    const to = formData.get("To");

    console.log("📥 Incoming call:", { from, to });

    const twiml = new VoiceResponse();

    // 1️⃣ Say greeting or acknowledgment (optional)
    twiml.say("You are now connected. The call will be transcribed.");

    // 2️⃣ Connect the inbound caller to your web client (if needed)
    const dial = twiml.dial();
    dial.client("web_dialer_user"); // must match token identity

    // 3️⃣ ✅ Add Media Stream for transcription
    const connect = twiml.connect();
    connect.stream({
      name: "voiceai-incoming-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/ws/twilio-stream`,
      track: "both_tracks", // captures inbound + outbound
    });

    console.log("🎤 Media Stream enabled for incoming call");

    // 4️⃣ Return TwiML to Twilio
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Incoming call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const twiml = new VoiceResponse();
  twiml.say("✅ Your Twilio incoming route is alive.");
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

