// src/app/api/calls/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db'
import Call from '../../../../../server/models/Call'
const { processTranscript } = require('../../../../../server/utils/ai-processor')

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connect()
    const body = await req.json()

    // Auto-process with AI if transcription is present and no sentiment yet
    if (body.transcription && body.transcription.length > 20) {
      try {
        const insights = await processTranscript(body.transcription);
        if (insights) {
          body.sentiment = insights.sentiment || 'neutral';
          body.extractedTasks = insights.tasks || [];
          if (insights.summary && !body.notes) {
            body.notes = insights.summary;
          }
        }
      } catch (aiErr) {
        console.error('⚠️ AI Insight generation failed:', aiErr);
      }
    }

    const updated = await Call.findByIdAndUpdate(params.id, body, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ Update call error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
