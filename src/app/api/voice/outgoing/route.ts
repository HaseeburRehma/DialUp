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

    console.log("📞 Outgoing call webhook hit. To:", To);

    const twiml = new VoiceResponse();

    // Always resolve callerId first
    const CallerEmail = formData.get("CallerEmail") as string | null;
    const CallerNumber = formData.get("CallerNumber") as string | null;

    const callerId =
      process.env.TWILIO_CALLER_ID ||
      (CallerNumber && process.env.ALLOW_CUSTOM_CALLER_ID === "true" ? CallerNumber : undefined);

    if (To && /^\+?\d+$/.test(To)) {
      // PSTN call (normal phone number)
      const dial = twiml.dial({ callerId });
      dial.number(To);

      console.log(`📤 Outgoing PSTN: From ${callerId} (user: ${CallerNumber}, ${CallerEmail}) To ${To}`);
    } else if (To) {
      // Client-to-client call
      const dial = twiml.dial({ callerId });
      dial.client(To);

      console.log(`📤 Outgoing Client Call: From ${callerId} → client:${To}`);
    } else {
      twiml.say("No destination provided");
    }

    // ✅ ADD THIS: Twilio Media Stream setup
    const connect = twiml.connect();
    connect.stream({
      name: "voiceai-live-stream",
      url: `wss://${process.env.PUBLIC_DOMAIN || "voiceai.wordpressstagingsite.com"}/ws/twilio-stream`,
      track: "both_tracks", // ensures inbound & outbound audio
    });

    console.log("🎤 Media Stream enabled to /ws/twilio-stream");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Outgoing route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
