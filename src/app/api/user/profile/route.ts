// src/app/api/user/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db'
import User from '../../../../../server/models/User'
import { verifyUserToken } from '../../../../../server/utils/verifyToken'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()
    const dbUser = await User.findById(user.id).select('-password')
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      username: dbUser.username,
      phone: dbUser.phone,
      role: dbUser.role,
      plan: dbUser.plan,
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
