// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Settings from '../../../../server/models/Settings.js';
import { connect } from '../../../../server/utils/db.js';
import { authOptions } from '@/lib/shared/authOptions';



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connect()
  let settings = await Settings.findOne({ userEmail: session.user.email })
  if (!settings) {
    settings = await Settings.create({ userEmail: session.user.email })
  }
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connect()
  const updates = await req.json()
  const settings = await Settings.findOneAndUpdate(
    { userEmail: session.user.email },
    updates,
    { new: true, upsert: true }
  )
  return NextResponse.json(settings)
}
