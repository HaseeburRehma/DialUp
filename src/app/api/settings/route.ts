// src/app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import Settings from '../../../../server/models/Settings'     // ← four levels up, not five
import { connect } from '../../../../server/utils/db'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(req: Request) {
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

export async function PATCH(req: Request) {
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
