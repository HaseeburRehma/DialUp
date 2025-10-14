// app/api/admin/plans/route.ts
import { NextResponse } from 'next/server'
import { getAllPlans } from '@/lib/db/admin'

export async function GET() {
  const plans = await getAllPlans()
  return NextResponse.json({ plans })
}
