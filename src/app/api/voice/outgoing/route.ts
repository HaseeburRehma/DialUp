// src/app/api/voice/outgoing/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const twiml = new VoiceResponse();

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const To = params.get("To")?.trim() || "";
    const Caller = params.get("Caller") || "";
    const CallSid = params.get("CallSid") || "";

    console.log("📞 Outgoing call webhook received:", { To, Caller, CallSid });

    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    // 🎧 Stream both tracks to the websocket handler
    const start = twiml.start();
    const stream = start.stream({
      name: "voiceai-outgoing-stream",
      url: wsUrl,
      track: "both_tracks",
    });
    stream.parameter({ name: "CallSid", value: CallSid });
    stream.parameter({ name: "Caller", value: Caller });

    const verifiedCallerId = process.env.TWILIO_CALLER_ID || "+447437985716";

    if (To && /^\+?\d+$/.test(To)) {
      // ✅ Outbound PSTN call
      twiml.dial({ callerId: verifiedCallerId }).number(To);
      console.log(`📤 Dialing PSTN number: ${To} (callerId: ${verifiedCallerId})`);
    } else if (To) {
      // ✅ Outbound client call
      twiml.dial({ callerId: verifiedCallerId }).client(To);
      console.log(`📤 Dialing Twilio Client: ${To}`);
    } else {
      // ⚠️ Invalid or missing number
      twiml.say("No valid destination number provided.");
      console.warn("⚠️ Missing or invalid 'To' parameter in request.");
    }

    // Log final TwiML for debugging
    console.log("🧾 Generated TwiML:\n", twiml.toString());

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Outgoing route error:", err);

    const errorTwiml = new VoiceResponse();
    errorTwiml.say("An error occurred while processing your call.");
    errorTwiml.hangup();

    return new NextResponse(errorTwiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
