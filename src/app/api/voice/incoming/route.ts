// src/app/api/voice/incoming/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { connect } from "../../../../../server/utils/db";
import User from "../../../../../server/models/User";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From");
    const to = formData.get("To");

    console.log("📥 Incoming call:", { from, to });

    await connect();

    // ✅ Lookup user by phone number (Twilio sends +E.164 format)
    const dbUser = await User.findOne({ phone: to });
    const userClient = dbUser ? dbUser.email.split("@")[0] : "web_dialer_user";

    const twiml = new VoiceResponse();

    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const host = req.headers.get("host") || "localhost:3000";
    const wsUrl = `${protocol}://${host}/twilio-stream`;

    const start = twiml.start();
    start.stream({
      name: "voiceai-incoming-stream",
      url: wsUrl,
      track: "both_tracks",
    });

    twiml.say(`Incoming call from ${from}. Connecting you now.`);
    const dial = twiml.dial();

    // ✅ Connect to the correct user’s client
    dial.client(userClient);

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ Incoming call error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
