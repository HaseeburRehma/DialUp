// components/dialer/call-analytics.tsx
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
            case 'completed': return 'bg-green-100 text-green-700 border-green-200'
            case 'busy': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'no-answer': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'failed': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-4 md:space-y-6 w-full max-w-5xl mx-auto min-w-0">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[10px] md:text-xs lg:text-sm">Total Calls</p>
                                <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">{stats.totalCalls}</p>
                            </div>
                            <Phone className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[10px] md:text-xs lg:text-sm">Today's Calls</p>
                                <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">{stats.todaysCalls}</p>
                            </div>
                            <Calendar className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[10px] md:text-xs lg:text-sm">Avg Duration</p>
                                <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">{formatDuration(stats.averageDuration)}</p>
                            </div>
                            <Clock className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[10px] md:text-xs lg:text-sm">Success Rate</p>
                                <p className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">{stats.successRate}%</p>
                            </div>
                            <TrendingUp className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-teal-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Chart */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-3 md:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
                        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-slate-900">Call Activity</h3>
                        <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {/* Simple activity visualization */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                                // Count calls that happened on this weekday
                                const dayCallCount = callHistory.filter(call =>
                                    new Date(call.timestamp).getDay() === i
                                ).length

                                return (
                                    <div key={i} className="text-center">
                                        <div
                                            className="bg-blue-100 rounded-md md:rounded-lg mb-1 md:mb-2 flex items-end justify-center"
                                            style={{ height: `${Math.max(20, dayCallCount * 8)}px` }}
                                        >
                                            <div className="bg-blue-500 rounded-sm w-full h-full opacity-80"></div>
                                        </div>
                                        <span className="text-[10px] md:text-xs text-slate-500">{day}</span>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Call Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-3 md:mb-4">Call Status Distribution</h3>
                        <div className="space-y-2 md:space-y-3">
                            {[
                                { status: 'completed', count: callHistory.filter((c: { status: string }) => c.status === 'completed').length, icon: CheckCircle },
                                { status: 'busy', count: callHistory.filter((c: { status: string }) => c.status === 'busy').length, icon: Users },
                                { status: 'no-answer', count: callHistory.filter((c: { status: string }) => c.status === 'no-answer').length, icon: Phone },
                                { status: 'failed', count: callHistory.filter((c: { status: string }) => c.status === 'failed').length, icon: XCircle },
                            ].map(({ status, count, icon: Icon }) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 md:space-x-3">
                                        <Icon className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
                                        <span className="text-xs md:text-sm text-slate-700 capitalize">{status.replace('-', ' ')}</span>
                                    </div>
                                    <Badge className={`${getStatusColor(status)} text-xs`}>
                                        {count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-3 md:mb-4">Call Direction</h3>
                        <div className="space-y-2 md:space-y-3">
                            {[
                                { direction: 'outbound', count: callHistory.filter((c: { direction: string }) => c.direction === 'outbound').length },
                                { direction: 'inbound', count: callHistory.filter((c: { direction: string }) => c.direction === 'inbound').length },
                            ].map(({ direction, count }) => (
                                <div key={direction} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 md:space-x-3">
                                        <Phone className={`h-3 w-3 md:h-4 md:w-4 flex-shrink-0 ${direction === 'outbound' ? 'text-blue-500' : 'text-green-500'}`} />
                                        <span className="text-xs md:text-sm text-slate-700 capitalize">{direction}</span>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
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