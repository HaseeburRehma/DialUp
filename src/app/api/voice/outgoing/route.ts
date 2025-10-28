// src/app/api/voice/outgoing/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const twiml = new VoiceResponse();

  try {
    // ✅ Always parse as URLSearchParams (Twilio sends x-www-form-urlencoded)
    const text = await req.text();
    const params = new URLSearchParams(text);

    const To = params.get("To")?.trim() || "";
    const Caller = params.get("Caller") || "";
    const CallSid = params.get("CallSid") || "";
    const From = params.get("From") || "";

    console.log("📞 Twilio webhook:", { To, Caller, CallSid, From });

    // ✅ Build WebSocket URL dynamically
    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    // 🎤 Start media stream
    const start = twiml.start();
    const stream = start.stream({
      name: "voiceai-stream",
      url: wsUrl,
      track: "both_tracks",
    });

    stream.parameter({ name: "CallSid", value: CallSid });
    stream.parameter({ name: "Caller", value: Caller });

    // ☎️ Dial logic
    const callerId = process.env.TWILIO_CALLER_ID || From || "+447437985716";

    if (To && /^\+?\d+$/.test(To)) {
      const dial = twiml.dial({ callerId });
      dial.number(To);
      console.log(`📤 Dialing PSTN: ${To}`);
    } else if (To) {
      const dial = twiml.dial({ callerId });
      dial.client(To);
      console.log(`📤 Dialing client: ${To}`);
    } else {
      twiml.say("No valid destination provided.");
      console.warn("⚠️ No 'To' parameter in request");
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

  } catch (err: any) {
    console.error("❌ Outgoing route error:", err);

    // 🔒 Return fallback TwiML instead of JSON
    const errorTwiml = new VoiceResponse();
    errorTwiml.say("An error occurred while processing your call. Please try again later.");
    errorTwiml.hangup();

    return new NextResponse(errorTwiml.toString(), {
      status: 200, // ✅ Return 200 so Twilio doesn’t retry endlessly
      headers: { "Content-Type": "text/xml" },
    });
  }
}

