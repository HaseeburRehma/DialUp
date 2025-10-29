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

    // 🎧 Send both inbound & outbound audio tracks to your websocket
    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    const start = twiml.start();
    start.stream({
      name: "voiceai-incoming-stream",
      url: wsUrl,
      track: "both_tracks", // inbound = caller, outbound = agent
    });

    // Optional Twilio-native transcription (not required if Whisper handles it)
    // twiml.append(`
    //   <Start>
    //     <Transcription name="voiceai-incoming-transcription"
    //       track="both_tracks"
    //       action="${process.env.PUBLIC_URL}/api/send-automatic-transcript"
    //       method="POST" playBeep="false" />
    //   </Start>`);

    console.log("🎙️ Media stream connected to Whisper backend");

    // Greet + connect to internal web client
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
