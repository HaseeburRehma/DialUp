import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../../server/utils/db.js'
import User from '../../../../../../server/models/User.js'
import { authOptions } from 'server/config/authOptions.js'
import { getServerSession } from "next-auth"

export async function PATCH(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { action } = await request.json()
    const userId = context.params?.id

    await connect()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'make-admin':
        user.role = 'admin'
        break
      case 'remove-admin':
        user.role = 'user'
        break
      case 'activate':
        user.isActive = true
        break
      case 'deactivate':
        user.isActive = false
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await user.save()

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
