// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary OTP store (replace with Redis or DB in production)
const otpStore: Record<string, string> = {};

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone || !phone.startsWith("+")) {
            return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
        }

        const isDev = process.env.NODE_ENV === "development";
        const code = isDev ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
        console.log(" ENV CHECK (Bypassed):", {
            SID: process.env.TWILIO_ACCOUNT_SID,
            API_KEY: process.env.TWILIO_API_KEY_SID,
            TOKEN: process.env.TWILIO_AUTH_TOKEN ? "✅ Loaded" : "❌ Missing",
        });

        /*
        const client = twilio(
            process.env.TWILIO_API_KEY_SID!,
            process.env.TWILIO_API_KEY_SECRET!,
            { accountSid: process.env.TWILIO_ACCOUNT_SID }
        );

        await client.messages.create({
            body: `Your VoiceAI verification code is ${code}`,
            messagingServiceSid: "MG3003536dee03ea24d8ae88afa276eb82",
            to: phone,
        });
        */

        otpStore[phone] = code;
        console.log(`📤 OTP ${code} sent to ${phone}`);

        return NextResponse.json({
            status: "sent",
            phone,
        });
    } catch (err: any) {
        console.error(" OTP Send Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Export store for verification route
export { otpStore };
