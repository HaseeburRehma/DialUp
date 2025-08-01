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
  CheckCircle
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

    if (session.user?.role !== 'admin') {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  const planColors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    team: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-orange-100 text-orange-800'
  }

  return (
    <div className="min-h-screen flex flex-col">
     
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitor system performance, user activity, and business metrics
            </p>
          </div>

          {stats && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeUsers} active this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      ${stats.totalRevenue.toLocaleString()} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    {stats.systemHealth.status === 'healthy' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{stats.systemHealth.status}</div>
                    <p className="text-xs text-muted-foreground">
                      Uptime: {stats.systemHealth.uptime}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Plan Distribution & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Plan Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Plan Distribution
                    </CardTitle>
                    <CardDescription>
                      User distribution across subscription plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.planDistribution).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={planColors[plan as keyof typeof planColors]}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Badge>
                            <span className="text-sm font-medium">{count} users</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((count / stats.totalUsers) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Signups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Signups
                    </CardTitle>
                    <CardDescription>
                      Latest user registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentSignups.map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={planColors[user.plan as keyof typeof planColors]}>
                              {user.plan}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
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
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild className="justify-start h-auto p-4">
                      <a href="/admin/users" className="flex flex-col items-start space-y-2">
                        <Users className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Manage Users</div>
                          <div className="text-sm text-muted-foreground">
                            View, edit, and manage user accounts
                          </div>
                        </div>
                      </a>
                    </Button>

                    <Button asChild variant="outline" className="justify-start h-auto p-4">
                      <a href="/admin/plans" className="flex flex-col items-start space-y-2">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Manage Plans</div>
                          <div className="text-sm text-muted-foreground">
                            Configure pricing and features
                          </div>
                        </div>
                      </a>
                    </Button>

                    <Button asChild variant="outline" className="justify-start h-auto p-4">
                      <a href="/admin/analytics" className="flex flex-col items-start space-y-2">
                        <BarChart3 className="h-5 w-5" />
                        <div>
                          <div className="font-medium">View Analytics</div>
                          <div className="text-sm text-muted-foreground">
                            Detailed usage and performance metrics
                          </div>
                        </div>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Server Status</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          stats.systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm capitalize">{stats.systemHealth.status}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Uptime</h4>
                      <p className="text-sm text-muted-foreground">{stats.systemHealth.uptime}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Last Backup</h4>
                      <p className="text-sm text-muted-foreground">{stats.systemHealth.lastBackup}</p>
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