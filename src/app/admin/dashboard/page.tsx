
// src/app/admin/dashboard/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  UserCheck,
  Crown,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  DollarSign
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  planDistribution: Record<string, number>
  recentSignups: Array<{
    id: string
    name: string
    email: string
    plan: string
    createdAt: string
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'error'
    uptime: string
    lastBackup: string
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if ((session.user as any)?.role !== 'admin') {
      router.push('/')
      return
    }

    fetchDashboardStats()
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return null
  }

  const planColors = {
    free: 'bg-slate-100 text-slate-700 border-slate-200',
    pro: 'bg-blue-100 text-blue-700 border-blue-200',
    team: 'bg-purple-100 text-purple-700 border-purple-200',
    enterprise: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              Monitor system performance, user activity, and business metrics
            </p>
          </div>

          {stats && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">Total Users</CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</div>
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      {stats.activeUsers} active this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">Monthly Revenue</CardTitle>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">${stats.monthlyRevenue.toLocaleString()}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      ${stats.totalRevenue.toLocaleString()} total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">Active Users</CardTitle>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats.activeUsers}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">System Status</CardTitle>
                    <div className={`p-2 rounded-lg ${stats.systemHealth.status === 'healthy' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {stats.systemHealth.status === 'healthy' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 capitalize">{stats.systemHealth.status}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      Uptime: {stats.systemHealth.uptime}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Plan Distribution & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Plan Distribution */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Plan Distribution
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      User distribution across subscription plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.planDistribution).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge className={`${planColors[plan as keyof typeof planColors]} border font-medium`}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Badge>
                            <span className="text-sm font-semibold text-slate-900">{count} users</span>
                          </div>
                          <div className="text-sm font-medium text-slate-600">
                            {Math.round((count / stats.totalUsers) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Signups */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Activity className="h-5 w-5 text-green-600" />
                      Recent Signups
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Latest user registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentSignups.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${planColors[user.plan as keyof typeof planColors]} border font-medium mb-1`}>
                              {user.plan}
                            </Badge>
                            <p className="text-xs text-slate-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-8">
                <CardHeader>
                  <CardTitle className="text-slate-900">Quick Actions</CardTitle>
                  <CardDescription className="text-slate-600">
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild className="justify-start h-auto p-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all">
                      <a href="/admin/users" className="flex flex-col items-start space-y-3">
                        <Users className="h-6 w-6" />
                        <div>
                          <div className="font-semibold text-lg">Manage Users</div>
                          <div className="text-sm text-blue-100">
                            View, edit, and manage user accounts
                          </div>
                        </div>
                      </a>
                    </Button>

                    <Button asChild variant="outline" className="justify-start h-auto p-6 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all">
                      <a href="/admin/plans" className="flex flex-col items-start space-y-3">
                        <CreditCard className="h-6 w-6 text-purple-600" />
                        <div>
                          <div className="font-semibold text-lg text-slate-900">Manage Plans</div>
                          <div className="text-sm text-slate-600">
                            Configure pricing and features
                          </div>
                        </div>
                      </a>
                    </Button>

                    <Button asChild variant="outline" className="justify-start h-auto p-6 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all">
                      <a href="/admin/analytics" className="flex flex-col items-start space-y-3">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="font-semibold text-lg text-slate-900">View Analytics</div>
                          <div className="text-sm text-slate-600">
                            Detailed usage and performance metrics
                          </div>
                        </div>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-slate-50">
                      <h4 className="font-semibold mb-2 text-slate-900">Server Status</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stats.systemHealth.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                          }`} />
                        <span className="text-sm font-medium text-slate-700 capitalize">{stats.systemHealth.status}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50">
                      <h4 className="font-semibold mb-2 text-slate-900">Uptime</h4>
                      <p className="text-sm text-slate-700 font-medium">{stats.systemHealth.uptime}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50">
                      <h4 className="font-semibold mb-2 text-slate-900">Last Backup</h4>
                      <p className="text-sm text-slate-700 font-medium">{stats.systemHealth.lastBackup}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>


    </div>
  )
}