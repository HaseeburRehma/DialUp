import { NextRequest, NextResponse } from 'next/server';
import { deletePlan, updatePlan } from '@/lib/db/admin'; // Fix this import too

export async function DELETE(request: NextRequest, context: { params: { planId: string } }) {
  try {
    const planId = context.params.planId;
    await deletePlan(planId);
    return NextResponse.json({ message: 'Plan deleted' }, { status: 200 });
  } catch (error) {
    console.error('Plan delete error:', error);
    return NextResponse.json({ message: 'Failed to delete plan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: { planId: string } }) {
  try {
    const planId = context.params.planId;
    const updates = await request.json();
    const updated = await updatePlan(planId, updates);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}
