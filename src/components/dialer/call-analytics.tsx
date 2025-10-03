//src/components/dialer/call-analytics.tsx

'use client'

import { useDialer } from './TwilioProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone, Clock, TrendingUp, Calendar,
  Users, CheckCircle, XCircle
} from 'lucide-react'
import { CallRecords } from './CallRecords'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export function CallAnalytics() {
  const { callHistory, getCallStats } = useDialer()
  const stats = getCallStats()

  // Sort latest first
  const recentCalls = [...callHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Build last 7 days dataset
  const callsByDay = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - (6 - i))
    const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' })

    const count = callHistory.filter(c =>
      new Date(c.timestamp).toDateString() === day.toDateString()
    ).length

    return { day: dayLabel, count }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'busy': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'no-answer': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-black/60 text-sm">Total Calls</p>
              <p className="text-2xl font-bold text-black">{stats.totalCalls}</p>
            </div>
            <Phone className="h-8 w-8 text-blue-400" />
          </CardContent>
        </Card>

        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-black/60 text-sm">Today's Calls</p>
              <p className="text-2xl font-bold text-black">{stats.todaysCalls}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-400" />
          </CardContent>
        </Card>

        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-black/60 text-sm">Avg Duration</p>
              <p className="text-2xl font-bold text-black">{formatDuration(stats.averageDuration)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-400" />
          </CardContent>
        </Card>

        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-black/60 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-black">{stats.successRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-teal-400" />
          </CardContent>
        </Card>
      </div>

      {/* 📊 Call Activity Chart */}
      <Card className="bg-black/10 backdrop-blur-md border-black/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-black mb-4">Call Activity (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#475569" />
                <YAxis allowDecimals={false} stroke="#475569" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-black mb-4">Call Status Distribution</h3>
            <div className="space-y-3">
              {[
                { status: 'completed', count: callHistory.filter(c => c.status === 'completed').length, icon: CheckCircle },
                { status: 'busy', count: callHistory.filter(c => c.status === 'busy').length, icon: Users },
                { status: 'no-answer', count: callHistory.filter(c => c.status === 'no-answer').length, icon: Phone },
                { status: 'failed', count: callHistory.filter(c => c.status === 'failed').length, icon: XCircle },
              ].map(({ status, count, icon: Icon }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-black/60" />
                    <span className="text-black/80 capitalize">{status.replace('-', ' ')}</span>
                  </div>
                  <Badge className={getStatusColor(status)}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-black mb-4">Call Direction</h3>
            <div className="space-y-3">
              {[
                { direction: 'outbound', count: callHistory.filter(c => c.direction === 'outbound').length },
                { direction: 'inbound', count: callHistory.filter(c => c.direction === 'inbound').length },
              ].map(({ direction, count }) => (
                <div key={direction} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className={`h-4 w-4 ${direction === 'outbound' ? 'text-blue-400' : 'text-green-400'}`} />
                    <span className="text-black/80 capitalize">{direction}</span>
                  </div>
                  <Badge className="bg-black/10 text-black/80 border-black/20">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Records 
      <CallRecords />
      */}
    </div>
  )
}
