// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../../server/utils/db.js'
import User from '../../../../../../server/models/User.js'
import { requireAuth } from '../../../../../../server/utils/requireAuth.js'

export async function PATCH(request: NextRequest, context: any) {
  try {
    const adminUser = await requireAuth(request)

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { action } = await request.json()
    const userId = context.params?.id

    await connect()

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'make-admin':
        targetUser.role = 'admin'
        break
      case 'remove-admin':
        targetUser.role = 'user'
        break
      case 'activate':
        targetUser.isActive = true
        break
      case 'deactivate':
        targetUser.isActive = false
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await targetUser.save()

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
