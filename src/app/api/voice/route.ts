// src/app/api/voice/route.ts
import { NextRequest } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(req: NextRequest) {
    const body = await req.formData()
    const to = body.get("To") as string | null

    const twiml = new VoiceResponse()

    if (to) {
        // Outbound call (browser -> phone)
        const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER })
        if (to.startsWith("+")) {
            dial.number(to)  // real PSTN number
        } else {
            dial.client(to)  // another Twilio client identity
        }
    } else {
        // Inbound call (phone -> Twilio number)
        const dial = twiml.dial()
        // e.g. route to john@example.com (must match token identity)
        dial.client(process.env.DEFAULT_CLIENT_IDENTITY || "guest_user") // route to browser client
    }

    return new Response(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
    })
}
