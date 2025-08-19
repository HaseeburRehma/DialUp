// components/dialer/Call-history.tsx
'use client'

import { useState } from 'react'
import { useDialer } from './TwilioProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock, 
  Search,
  Play,
  Download,
  MessageSquare,
  Calendar,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function CallHistory() {
  const { callHistory } = useDialer()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')

  const filteredHistory = callHistory.filter(call => {
    const matchesSearch = call.number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus
    const matchesDirection = filterDirection === 'all' || call.direction === filterDirection
    
    return matchesSearch && matchesStatus && matchesDirection
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
      {/* Search and Filters */}
      <Card className="bg-black/10 backdrop-blur-md border-black/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 h-4 w-4" />
              <Input
                placeholder="Search by phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/10 border-black/20 text-black placeholder-black/40"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-black/10 border border-black/20 rounded-md text-black text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="busy">Busy</option>
                <option value="no-answer">No Answer</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="px-3 py-2 bg-black/10 border border-black/20 rounded-md text-black text-sm"
              >
                <option value="all">All Calls</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card className="bg-black/10 backdrop-blur-md border-black/20">
            <CardContent className="p-12 text-center">
              <Phone className="h-12 w-12 text-black/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No Call History</h3>
              <p className="text-black/60">
                {searchTerm || filterStatus !== 'all' || filterDirection !== 'all' 
                  ? 'No calls match your current filters.' 
                  : 'Start making calls to see your history here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((call) => (
            <Card key={call.id} className="bg-black/10 backdrop-blur-md border-black/20 hover:bg-black/15 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {call.direction === 'outbound' ? (
                        <PhoneOutgoing className="h-5 w-5 text-blue-400" />
                      ) : (
                        <PhoneIncoming className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-black">{call.number}</h3>
                        <Badge className={getStatusColor(call.status)}>
                          {call.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-black/60">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDistanceToNow(call.timestamp, { addSuffix: true })}</span>
                        </div>
                        
                        {call.duration > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(call.duration)}</span>
                          </div>
                        )}
                        
                        <span className="capitalize text-black/50">
                          {call.direction}
                        </span>
                      </div>
                      
                      {call.notes && (
                        <div className="mt-2 p-2 bg-black/5 rounded text-sm text-black/80">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {call.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {call.recording && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-black/70 hover:text-blue-300 hover:bg-blue-500/20"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-black/70 hover:text-green-300 hover:bg-green-500/20"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black/70 hover:text-black hover:bg-black/10"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}