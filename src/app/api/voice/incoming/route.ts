// src/app/api/voice/incoming/route.ts

import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From");
    const to = formData.get("To");

    console.log("📥 Incoming call:", { from, to });

    const twiml = new VoiceResponse();

    // 1️⃣ Attach media stream first
    const start = twiml.start();
    start.stream({
      name: "voiceai-incoming-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/twilio-stream`,
      track: "both_tracks",
    });
    console.log("🎤 Media stream attached (incoming)");

    // 2️⃣ Greet or forward call
    twiml.say("You are now connected. The call will be transcribed.");

    const dial = twiml.dial();
    dial.client("web_dialer_user"); // must match token identity

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Incoming call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
