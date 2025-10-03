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

    // 🔴 Start media stream to our backend
    const start = twiml.start();
    start.stream({
      url: `${process.env.BASE_URL}/api/voice/stream`,
      track: "outbound_track"
    });
    start.stream({
      url: `${process.env.BASE_URL}/api/voice/stream`,
      track: "inbound_track"   // or outbound_track if you want agent audio
    });

    // 🔴 Forward the call to your client (browser user)
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

export async function GET() {
  const twiml = new VoiceResponse();
  twiml.say("✅ Your Twilio incoming route is alive.");
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
