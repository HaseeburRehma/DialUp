//src/app/api/voice/outgoing/route.ts

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
    const formData = await req.formData();
    const To = (formData.get("To") as string | null)?.trim() || null;
    const CallerEmail = formData.get("CallerEmail") as string | null;
    const CallerNumber = formData.get("CallerNumber") as string | null;

    console.log("📞 Outgoing call webhook hit. To:", To);

    const twiml = new VoiceResponse();

    // 1️⃣ Attach stream first (before Dial)
    const start = twiml.start();
    start.stream({
      name: "voiceai-live-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/twilio-stream`,
      track: "both_tracks",
    });
    console.log("🎤 Media stream attached (before dial)");

    // 2️⃣ Then dial the number or client
    const callerId =
      process.env.TWILIO_CALLER_ID ||
      (CallerNumber && process.env.ALLOW_CUSTOM_CALLER_ID === "true" ? CallerNumber : undefined);

    if (To && /^\+?\d+$/.test(To)) {
      const dial = twiml.dial({ callerId });
      dial.number(To);
      console.log(`📤 Outgoing PSTN: From ${callerId} to ${To}`);
    } else if (To) {
      const dial = twiml.dial({ callerId });
      dial.client(To);
      console.log(`📤 Outgoing Client: From ${callerId} to client:${To}`);
    } else {
      twiml.say("No destination provided");
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

