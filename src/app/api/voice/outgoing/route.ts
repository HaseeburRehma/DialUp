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
    const formData = await req.formData();
    const To = (formData.get("To") as string | null)?.trim() || null;

    console.log("📞 Outgoing call webhook hit. To:", To);

    const twiml = new VoiceResponse();

    if (To && /^\+?\d+$/.test(To)) {
      // PSTN call (normal phone number)
      const callerId = process.env.TWILIO_CALLER_ID || "+447437985716"; // fallback
      const dial = twiml.dial({ callerId });
      dial.number(To);
    } else if (To) {
      // Client-to-client call
      const dial = twiml.dial();
      dial.client(To);
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

