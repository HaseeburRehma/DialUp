// src/app/api/send-automatic-transcript/route.ts

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Twilio sends this as application/x-www-form-urlencoded
 * We just log the transcript and return 200 XML.
 */
export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const CallSid = params.get("CallSid");
    const TranscriptionText =
      params.get("TranscriptionText") ||
      params.get("transcript") ||
      "No text";

    console.log("📝 Received Twilio transcript:", {
      CallSid,
      TranscriptionText: TranscriptionText.slice(0, 200),
    });

    // ✅ respond with TwiML XML so Twilio doesn't throw 11200
    const xml = `
      <Response>
        <Say>Transcript received.</Say>
      </Response>
    `;

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("❌ send-automatic-transcript error:", err);

    const fallback = `
      <Response>
        <Say>Error processing transcript.</Say>
      </Response>
    `;
    return new NextResponse(fallback, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
