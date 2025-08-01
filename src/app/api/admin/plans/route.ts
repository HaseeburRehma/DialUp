import { NextResponse } from 'next/server';
import { getAllPlans, createPlan } from '@/lib/db/admin'; // Replace with your data layer

export async function GET(request: Request) {
  try {
    const plans = await getAllPlans();
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ message: 'Failed to load plans' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPlan = await createPlan(body);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Plan creation error:', error);
    return NextResponse.json({ message: 'Failed to create plan' }, { status: 500 });
  }
}