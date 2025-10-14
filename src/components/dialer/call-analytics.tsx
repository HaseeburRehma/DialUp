// components/dialer/Call-history.tsx
'use client'

import { useDialer } from './TwilioProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Phone,
    Clock,
    TrendingUp,
    Calendar,
    BarChart3,
    Users,
    CheckCircle,
    XCircle
} from 'lucide-react'

export function CallAnalytics() {
    const { callHistory, getCallStats } = useDialer()
    const stats = getCallStats()

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
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-black/60 text-sm">Total Calls</p>
                                <p className="text-2xl font-bold text-black">{stats.totalCalls}</p>
                            </div>
                            <Phone className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-black/60 text-sm">Today's Calls</p>
                                <p className="text-2xl font-bold text-black">{stats.todaysCalls}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-black/60 text-sm">Avg Duration</p>
                                <p className="text-2xl font-bold text-black">{formatDuration(stats.averageDuration)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-black/60 text-sm">Success Rate</p>
                                <p className="text-2xl font-bold text-black">{stats.successRate}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-teal-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Chart */}
            <Card className="bg-black/10 backdrop-blur-md border-black/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-black">Call Activity</h3>
                        <BarChart3 className="h-5 w-5 text-black/60" />
                    </div>

                    <div className="space-y-4">
                        {/* Simple activity visualization */}
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                                // Count calls that happened on this weekday
                                const dayCallCount = callHistory.filter(call =>
                                    new Date(call.timestamp).getDay() === i
                                ).length

                                return (
                                    <div key={i} className="text-center">
                                        <div
                                            className="bg-blue-500/20 rounded-lg mb-2 flex items-end justify-center"
                                            style={{ height: `${Math.max(20, dayCallCount * 8)}px` }}
                                        >
                                            <div className="bg-blue-400 rounded-sm w-full h-full opacity-60"></div>
                                        </div>
                                        <span className="text-xs text-black/60">{day}</span>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Call Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-black mb-4">Call Status Distribution</h3>
                        <div className="space-y-3">
                            {[
                                { status: 'completed', count: callHistory.filter((c: { status: string }) => c.status === 'completed').length, icon: CheckCircle },
                                { status: 'busy', count: callHistory.filter((c: { status: string }) => c.status === 'busy').length, icon: Users },
                                { status: 'no-answer', count: callHistory.filter((c: { status: string }) => c.status === 'no-answer').length, icon: Phone },
                                { status: 'failed', count: callHistory.filter((c: { status: string }) => c.status === 'failed').length, icon: XCircle },
                            ].map(({ status, count, icon: Icon }) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Icon className="h-4 w-4 text-black/60" />
                                        <span className="text-black/80 capitalize">{status.replace('-', ' ')}</span>
                                    </div>
                                    <Badge className={getStatusColor(status)}>
                                        {count}
                                    </Badge>
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
                                { direction: 'outbound', count: callHistory.filter((c: { direction: string }) => c.direction === 'outbound').length },
                                { direction: 'inbound', count: callHistory.filter((c: { direction: string }) => c.direction === 'inbound').length },
                            ].map(({ direction, count }) => (
                                <div key={direction} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Phone className={`h-4 w-4 ${direction === 'outbound' ? 'text-blue-400' : 'text-green-400'}`} />
                                        <span className="text-black/80 capitalize">{direction}</span>
                                    </div>
                                    <Badge className="bg-black/10 text-black/80 border-black/20">
                                        {count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}