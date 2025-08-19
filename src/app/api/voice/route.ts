// src/app/api/voice/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const { VoiceResponse } = twilio.twiml

// 🌍 Country code map
const COUNTRY_CODES: Record<string, string> = {
  US: '+1',
  PK: '+92',
  UK: '+44',
  IN: '+91',
  CA: '+1',
  AU: '+61',
  // add more as needed
}

// Default country from env (fallback = US)
const DEFAULT_COUNTRY = (process.env.DEFAULT_COUNTRY || 'US') as keyof typeof COUNTRY_CODES

// Helper: normalize to E.164
function normalizeNumber(input: string, defaultCountry: keyof typeof COUNTRY_CODES = DEFAULT_COUNTRY): string {
  let num = input.replace(/\D/g, '') // keep only digits

  // Already E.164
  if (input.startsWith('+')) return input

  // Handle local formats like 0335..., 071..., 212...
  if (defaultCountry === 'PK' && num.startsWith('0')) {
    num = num.replace(/^0+/, '') // drop leading 0
    return COUNTRY_CODES['PK'] + num
  }

  if (defaultCountry === 'UK' && num.startsWith('0')) {
    num = num.replace(/^0+/, '')
    return COUNTRY_CODES['UK'] + num
  }

  if (defaultCountry === 'US' && num.length === 10) {
    return COUNTRY_CODES['US'] + num
  }

  // Fallback: prefix with chosen country code
  return COUNTRY_CODES[defaultCountry] + num
}

// 👉 For debugging in browser
export async function GET() {
  const twiml = new VoiceResponse()
  twiml.say({ voice: 'alice' }, 'Your TwiML voice endpoint is working!')

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// 👉 For Twilio Voice webhook
// 👉 For Twilio Voice webhook
export async function POST(req: Request) {
  const body = await req.formData()
  const toRaw = body.get('To')?.toString()
  console.log("📞 Incoming Voice POST", { toRaw })

  const twiml = new VoiceResponse()
  const dial = twiml.dial({ callerId: process.env.TWILIO_CALLER_ID })

  if (toRaw) {
    if (/^\+?\d+$/.test(toRaw)) {
      const normalized = normalizeNumber(toRaw)
      console.log("🔢 Normalized number:", normalized)
      dial.number(normalized)
    } else {
      console.log("👤 Dialing client:", toRaw)
      dial.client(toRaw)
    }
  } else {
    console.log("👤 No 'To' → defaulting to web_dialer_user")
    dial.client('web_dialer_user')
  }

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
