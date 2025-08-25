import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connect } from '../../../../../server/utils/db'
import User from '../../../../../server/models/User'
import { authOptions } from 'server/config/authOptions.js'

export async function GET() {
  try {
    await connect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(session.user.id).select('-password')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role,
      plan: user.plan
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}