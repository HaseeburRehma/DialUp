// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Settings from '../../../../server/models/Settings.js'
import { connect } from '../../../../server/utils/db.js'
import { verifyUserToken } from '../../../../server/utils/verifyToken.js'
import User from '../../../../server/models/User.js'

export async function GET(req: NextRequest) {
  const user = await verifyUserToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connect()
  const dbUser = await User.findById(user.id)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let settings = await Settings.findOne({ userEmail: dbUser.email })
  if (!settings) {
    settings = await Settings.create({ userEmail: dbUser.email })
  }

  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const user = await verifyUserToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connect()
  const dbUser = await User.findById(user.id)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updates = await req.json()
  const settings = await Settings.findOneAndUpdate(
    { userEmail: dbUser.email },
    updates,
    { new: true, upsert: true }
  )
  return NextResponse.json(settings)
}
