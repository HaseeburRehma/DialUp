// src/app/api/recording/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../server/utils/db.js';
import Call from '../../../../server/models/Call';
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const recordingUrl = body.get('RecordingUrl') as string
    const callSid = body.get('CallSid') as string

    if (!recordingUrl) return NextResponse.json({ error: 'No recording URL' }, { status: 400 })

    // download file
    const audioRes = await axios.get(recordingUrl + '.mp3', { responseType: 'arraybuffer' })

    // upload to GridFS
    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/upload`, {
      method: 'POST',
      body: (() => {
        const form = new FormData()
        form.append('file', new Blob([audioRes.data], { type: 'audio/mpeg' }), `${callSid}.mp3`)
        return form
      })(),
    }).then(r => r.json())

    // update call record
    await connect()
    await Call.findOneAndUpdate({ metadata: { callSid } }, { recording: uploadRes.url })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Recording Save Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
