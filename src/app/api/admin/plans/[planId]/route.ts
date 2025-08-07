import { NextRequest, NextResponse } from 'next/server';
import { deletePlan, updatePlan } from '@/lib/db/admin';
import type { NextRequestHandlerContext } from 'next/server';

export async function DELETE(
  request: NextRequest,
  context: { params: { planId: string } }
) {
  try {
    const { planId } = context.params;

    if (!planId) {
      return NextResponse.json({ message: 'Missing plan ID' }, { status: 400 });
    }

    await deletePlan(planId);
    return NextResponse.json({ message: 'Plan deleted' }, { status: 200 });
  } catch (error) {
    console.error('Plan delete error:', error);
    return NextResponse.json({ message: 'Failed to delete plan' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { planId: string } }
) {
  try {
    const { planId } = context.params;

    if (!planId) {
      return NextResponse.json({ message: 'Missing plan ID' }, { status: 400 });
    }

    const updates = await request.json();
    const updated = await updatePlan(planId, updates);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}
