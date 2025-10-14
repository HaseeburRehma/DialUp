import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db.js'
import User from '../../../../../server/models/User.js'
import { getServerSession } from 'next-auth'
import { authOptions } from 'server/config/authOptions.js'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connect()

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ 
      users: users.map(user => ({
        ...user,
        id: (user._id as string).toString(),

      }))
    })
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}