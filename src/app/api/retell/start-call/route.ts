// src/app/api/retell/start-call/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { retellClient } from '@/lib/retellClient';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { from_number, to_number, agent_id } = body || {};

  if (!from_number || !to_number) {
    return NextResponse.json(
      { error: 'from_number and to_number are required' },
      { status: 400 },
    );
  }

  try {
    const call = await retellClient.call.createPhoneCall({
      from_number,
      to_number,
      agent: agent_id || 'agent_50d6922766280483468137fd9a', // optional agent override
    });

    return NextResponse.json(call);
  } catch (err: any) {
    console.error('Error creating call:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
