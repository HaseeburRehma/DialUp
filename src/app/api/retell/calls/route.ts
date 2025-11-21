// src/app/api/retell/calls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { retellClient } from '@/lib/retellClient'

export type RetellCallSummary = {
  call_id: string
  call_type: 'phone_call' | 'web_call'
  agent_id: string
  agent_name?: string
  call_status: string
  direction?: 'inbound' | 'outbound'
  from_number?: string
  to_number?: string
  start_timestamp?: number
  end_timestamp?: number
  disconnection_reason?: string
  transcript?: string
  recording_url?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 20)

  try {
    const result = await retellClient.call.list({
      filter_criteria: {
        call_type: ['phone_call'],
      },
      sort_order: 'descending',
      limit,
    })

    // Support result being { data: [] } or { calls: [] } or [] directly
    const raw: any[] =
      (result as any)?.data ??
      (result as any)?.calls ??
      (Array.isArray(result) ? result : [])

    const calls: RetellCallSummary[] = raw.map((c: any) => ({
      call_id: c.call_id,
      call_type: c.call_type,
      agent_id: c.agent_id,
      agent_name: c.agent?.name ?? c.agent_name,
      call_status: c.call_status,
      direction: c.direction,
      from_number: c.from_number,
      to_number: c.to_number,
      start_timestamp: c.start_timestamp,
      end_timestamp: c.end_timestamp,
      disconnection_reason: c.disconnection_reason,
      transcript: c.transcript,
      recording_url: c.recording_url,
    }))

    return NextResponse.json({ calls })
  } catch (err: any) {
    console.error('Retell list calls failed', err)
    return NextResponse.json(
      { error: err?.message ?? 'Retell error' },
      { status: 500 }
    )
  }
}
