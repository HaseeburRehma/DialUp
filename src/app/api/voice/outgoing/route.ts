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
    const CallerNumber = params.get("CallerNumber") || "";
    const CallSid = params.get("CallSid") || "";
    const From = params.get("From") || "";

    console.log("📞 Outgoing call webhook:", { To, Caller, CallerNumber, CallSid, From });

    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    const start = twiml.start();
    const stream = start.stream({
      name: "voiceai-outgoing-stream",
      url: wsUrl,
      track: "both_tracks",
    });

    stream.parameter({ name: "CallSid", value: CallSid });
    stream.parameter({ name: "Caller", value: Caller });
    stream.parameter({ name: "CallerNumber", value: CallerNumber });

    // ✅ Use the user's registered number as caller ID
    const callerId = CallerNumber || process.env.TWILIO_CALLER_ID || "+10000000000";

    if (To && /^\+?\d+$/.test(To)) {
      twiml.dial({ callerId }).number(To);
      console.log(`📤 Dialing PSTN: ${To} from ${callerId}`);
    } else if (To) {
      twiml.dial({ callerId }).client(To);
      console.log(`📤 Dialing client: ${To} from ${callerId}`);
    } else {
      twiml.say("No valid destination provided.");
      console.warn("⚠️ Missing 'To' parameter");
    }

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
