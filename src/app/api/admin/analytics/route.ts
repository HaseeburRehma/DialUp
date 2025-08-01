import { NextResponse } from 'next/server';
import { getAnalyticsStats } from '@/lib/db/admin'; // Replace with your data layer

export async function GET(request: Request) {
  try {
    const stats = await getAnalyticsStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ message: 'Failed to load analytics' }, { status: 500 });
  }
}

