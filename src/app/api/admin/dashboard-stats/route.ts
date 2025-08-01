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

    // Get total and active users
    const totalUsers = await User.countDocuments()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: thirtyDaysAgo } 
    })

    // Get plan distribution
    const planDistribution = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    const planDist = planDistribution.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Get recent signups (last 10)
    const recentSignups = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email plan createdAt')
      .lean()

    // Mock revenue data (you'd get this from your payment provider)
    const monthlyRevenue = 15420
    const totalRevenue = 142500

    const stats = {
      totalUsers,
      activeUsers,
      monthlyRevenue,
      totalRevenue,
      planDistribution: planDist,
      recentSignups: recentSignups.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt
      })),
      systemHealth: {
        status: 'healthy' as const,
        uptime: '99.9%',
        lastBackup: new Date().toISOString()
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}