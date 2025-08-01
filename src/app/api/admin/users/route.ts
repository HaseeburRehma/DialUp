import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db'
import User from '../../../../../server/models/User'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

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
        _id: user._id.toString()
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