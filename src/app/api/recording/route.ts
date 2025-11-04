// src/app/api/recording/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../server/utils/db.js'
import Call from '../../../../server/models/Call'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const recordingUrl = body.get('RecordingUrl') as string
    const callSid = body.get('CallSid') as string
    if (!recordingUrl) {
      return NextResponse.json({ error: 'No recording URL provided' }, { status: 400 })
    }

    // 1️⃣ Download Twilio recording (append .mp3)
    const audioRes = await axios.get(recordingUrl + '.mp3', { responseType: 'arraybuffer' })

    // 2️⃣ Build a base URL dynamically (works both locally & in production)
    const proto = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http')
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const base = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`

    // 3️⃣ Upload to your Next.js GridFS handler (/api/upload)
    const form = new FormData()
    form.append('file', new Blob([audioRes.data], { type: 'audio/mpeg' }), `${callSid}.mp3`)
    const uploadRes = await fetch(`${base}/api/upload`, { method: 'POST', body: form })
    const uploadJson = await uploadRes.json()

    if (!uploadRes.ok || !uploadJson?.url) {
      throw new Error(`Upload failed: ${uploadJson?.error || uploadRes.statusText}`)
    }

    // 4️⃣ Update Call record with the GridFS URL
    await connect()
    await Call.findOneAndUpdate(
      { 'metadata.callSid': callSid },
      { recording: uploadJson.url },
      { new: true }
    )

    console.log(`✅ Twilio recording saved for ${callSid}: ${uploadJson.url}`)

    // 5️⃣ Return the GridFS-based playback URL
    return NextResponse.json({ success: true, recording: uploadJson.url })
  } catch (err: any) {
    console.error('❌ Recording Save Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
