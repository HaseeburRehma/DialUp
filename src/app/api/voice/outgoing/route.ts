// src/app/api/voice/outgoing/route.ts

import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function GET() {
  return new NextResponse("<Response><Say>✅ Outgoing endpoint alive</Say></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: Request) {
  try {
    // ✅ FIX: Parse x-www-form-urlencoded safely
    const bodyText = await req.text();
    const formData = new URLSearchParams(bodyText);

    const To = formData.get("To")?.trim() || null;
    const CallerEmail = formData.get("CallerEmail");
    const CallerNumber = formData.get("CallerNumber");
    const ReceiverEmail = formData.get("ReceiverEmail");

    console.log("📞 Outgoing call webhook hit. To:", To);
    console.log("CallerEmail:", CallerEmail, "ReceiverEmail:", ReceiverEmail);

    const twiml = new VoiceResponse();
    twiml.say(`Connecting call for ${CallerEmail || "unknown caller"}`);

    // ✅ 1️⃣ Start Twilio Media Stream (to your WebSocket)
    const start1 = twiml.start();
    start1.stream({
      name: "voiceai-live-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/twilio-stream`,
      track: "both_tracks",
    });

    

    console.log("🎤 Media Stream + Real-Time Transcription enabled");

    // ✅ 3️⃣ Dial logic
    const callerId =
      process.env.TWILIO_CALLER_ID ||
      (CallerNumber && process.env.ALLOW_CUSTOM_CALLER_ID === "true"
        ? CallerNumber
        : undefined);

    if (To && /^\+?\d+$/.test(To)) {
      const dial = twiml.dial({ callerId });
      dial.number(To);
      console.log(`📤 Outgoing PSTN call: From ${callerId} → ${To}`);
    } else if (To) {
      const dial = twiml.dial({ callerId });
      dial.client(To);
      console.log(`📤 Outgoing Client Call: From ${callerId} → client:${To}`);
    } else {
      twiml.say("No destination number provided.");
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Outgoing route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
