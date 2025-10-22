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

    // 1️⃣ Attach Twilio Media Stream (real-time to Whisper)
    const start = twiml.start();
    start.stream({
      name: "voiceai-incoming-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/twilio-stream`,
      track: "both_tracks",
    });

    // 2️⃣ Attach Twilio Transcription (Twilio’s native STT)
    twiml.append(`
      <Start>
        <Transcription 
          name="voiceai-incoming-transcription"
          track="both_tracks"
          action="${process.env.PUBLIC_URL || "https://voiceai.wordpressstagingsite.com"}/api/send-automatic-transcript"
          method="POST"
          playBeep="false" />
      </Start>
    `);

    console.log("🎙️ Media stream + transcription enabled (incoming)");

    // 3️⃣ Greet and forward
    twiml.say("You are now connected. The call will be transcribed.");
    const dial = twiml.dial();
    dial.client("web_dialer_user");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Incoming call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
