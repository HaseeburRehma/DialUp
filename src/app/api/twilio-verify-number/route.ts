import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { phone } = await req.json();

        if (!phone || !phone.startsWith("+")) {
            return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
        }

        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        );

        // 🔹 Check if already verified
        const existing = await client.outgoingCallerIds.list({ phoneNumber: phone });
        if (existing.length > 0) {
            return NextResponse.json({ status: "already_verified", sid: existing[0].sid });
        }

        // 🔹 Create verification (Twilio will call/SMS this number)
        const result = await (client.outgoingCallerIds as any).create({
            phoneNumber: phone,
            friendlyName: `User ${phone}`,
        });


        return NextResponse.json({
            status: "verification_started",
            sid: result.sid,
            phone: result.phoneNumber,
        });
    } catch (err: any) {
        console.error("❌ Twilio Verify Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
