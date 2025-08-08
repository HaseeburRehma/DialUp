import { NextResponse } from 'next/server'
import { getAnalyticsStats } from '@/lib/db/admin'

export async function GET() {
  try {
    const stats = await getAnalyticsStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
