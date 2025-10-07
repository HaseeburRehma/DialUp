// src/app/api/voice/outgoing/route.ts
// src/app/api/voice/outgoing/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const To = (formData.get("To") as string | null)?.trim() || null;
    const CallerNumber = (formData.get("CallerNumber") as string | null) || undefined;

    console.log("📞 Outgoing call webhook hit. To:", To);

    const twiml = new VoiceResponse();

    // ✅ Global media stream setup (valid placement)
    const start = twiml.start();
    start.stream({
      url: `${process.env.BASE_URL}/api/voice/stream`,
      track: "inbound_track",
    });
    start.stream({
      url: `${process.env.BASE_URL}/api/voice/stream`,
      track: "outbound_track",
    });

    const callerId =
      process.env.TWILIO_CALLER_ID ||
      process.env.DEFAULT_CALLER_ID ||
      "+12184893380";

    // ✅ PSTN call
    if (To && /^\+?\d+$/.test(To)) {
      const dial = twiml.dial({
        callerId,
        record: "record-from-answer-dual",
        trim: "do-not-trim",
      });
      dial.number(To);
      console.log(`📤 Outgoing PSTN call: ${callerId} → ${To}`);
    }

    // ✅ Client call
    else if (To) {
      const dial = twiml.dial({ callerId });
      dial.client(To);
      console.log(`📤 Outgoing client call: ${callerId} → client:${To}`);
    }

    // ✅ No destination
    else {
      twiml.say("No destination number provided.");
    }

    const xml = twiml.toString();
    console.log("🧾 Final TwiML:\n", xml);

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ TwiML generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return new NextResponse("<Response><Say>✅ Outgoing endpoint alive</Say></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}



