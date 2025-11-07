import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isVerifiedNumber(num: string): Promise<boolean> {
  try {
    const list = await client.outgoingCallerIds.list();
    return list.some((id) => id.phoneNumber === num);
  } catch (e) {
    console.error("Caller ID check failed:", e);
    return false;
  }
}

export async function POST(req: Request) {
  const twiml = new VoiceResponse();

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const To = params.get("To")?.trim() || "";
    const From = params.get("From")?.trim() || "";
    const Caller = params.get("Caller") || "";
    const CallSid = params.get("CallSid") || "";

    console.log("📞 Outgoing call webhook received:", { To, From, Caller, CallSid });

    // Build WebSocket stream URL
    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    // 🎧 Stream both audio tracks
    const start = twiml.start();
    const stream = start.stream({
      name: "voiceai-outgoing-stream",
      url: wsUrl,
      track: "both_tracks",
    });
    stream.parameter({ name: "CallSid", value: CallSid });
    stream.parameter({ name: "Caller", value: Caller });
    stream.parameter({ name: "From", value: From });

    // 🧠 Verify user's number before using it as caller ID
    let verifiedCallerId = process.env.TWILIO_CALLER_ID || "+447437985716";
    if (From && /^\+\d+$/.test(From)) {
      const ok = await isVerifiedNumber(From);
      if (ok) {
        verifiedCallerId = From;
        console.log(`✅ Using verified caller ID: ${From}`);
      } else {
        console.warn(`⚠️ ${From} not verified, falling back to ${verifiedCallerId}`);
      }
    }

    // 🏗️ Dial logic
    if (To && /^\+?\d+$/.test(To)) {
      twiml.dial({ callerId: verifiedCallerId }).number(To);
      console.log(`📤 Dialing PSTN number: ${To} (callerId: ${verifiedCallerId})`);
    } else if (To) {
      twiml.dial({ callerId: verifiedCallerId }).client(To);
      console.log(`📤 Dialing Twilio Client: ${To}`);
    } else {
      twiml.say("No valid destination number provided.");
      console.warn("⚠️ Missing or invalid 'To' parameter in request.");
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
