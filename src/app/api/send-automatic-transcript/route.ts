// src/app/api/send-call-transcript/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Call the new consolidated endpoint internally
    const resp = await fetch(`${process.env.BASE_URL}/api/send-automatic-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: body.transcript,
        callDuration: body.callDuration,
        callDate: body.callDate,
        callerNumber: body.callerNumber,
        receiverNumber: body.receiverNumber || "Unknown",
        callerEmail: body.callerEmail || null,
        receiverEmail: body.recipientEmail || null, // map old param → new
        
      }),
    })

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })

  } catch (err: any) {
    console.error("Error proxying send-call-transcript:", err)
    return NextResponse.json({ error: "Failed to process transcript", details: err.message }, { status: 500 })
  }
}
