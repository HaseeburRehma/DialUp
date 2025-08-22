// src/app/api/voice/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    // Grab form params Twilio sends (like "To", "From", etc.)
    const formData = await req.formData();
    const to = formData.get("To") as string | null;
    const from = formData.get("From") as string | null;

    console.log("🔔 Twilio hit /api/voice");
    console.log("➡️ Incoming POST params:", Object.fromEntries(formData));

    const twiml = new twilio.twiml.VoiceResponse();

    if (to) {
      console.log(`📞 Outbound call requested to: ${to}`);
      twiml.dial(to);
    } else {
      console.log(`📥 Inbound call from: ${from}`);
      twiml.say("Thanks for calling! This is your test connection.");
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("❌ Error handling Twilio Voice request:", err);
    return new NextResponse("<Response><Say>Server error</Say></Response>", {
      headers: { "Content-Type": "text/xml" },
      status: 500,
    });
  }
}
