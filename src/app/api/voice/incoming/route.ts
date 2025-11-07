import { NextResponse } from "next/server";
import twilio from "twilio";
import { connect } from "../../../../../server/utils/db.js";

import User from "../../../../../server/models/User.js"; // adjust if your user model path differs

const VoiceResponse = twilio.twiml.VoiceResponse;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From")?.toString();
    const to = formData.get("To")?.toString();

    console.log("📥 Incoming call:", { from, to });

    // --- Find which verified user this number belongs to ---
    await connect();
    const user = await User.findOne({ phone: to }); // user.phone = verified number used at signup
    console.log("👤 Matched incoming number to user:", user?.email);

    const twiml = new VoiceResponse();

    // --- Start Whisper or your transcription backend ---
    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    const start = twiml.start();
    start.stream({
      name: "voiceai-incoming-stream",
      url: wsUrl,
      track: "both_tracks",
    });

    console.log("🎙️ Media stream connected to Whisper backend");

    // --- Build call routing ---
    // If user exists, ring both:
    // 1️⃣ Their web dialer client
    // 2️⃣ Their real verified phone number
    const dial = twiml.dial({
      callerId: from || process.env.TWILIO_CALLER_ID || "+447437985716",
      answerOnBridge: true,
    });

    if (user) {
      // 🔔 Ring the web dialer client (popup)
      dial.client(user.email); // or use user._id or user Twilio identity
      // ☎️ Also forward to their verified real number
      dial.number(user.phone);
    } else {
      // Default fallback if no user found
      twiml.say("Thanks for calling. No agent is available right now.");
    }

    console.log("📡 Dual-ring TwiML generated");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Incoming call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
