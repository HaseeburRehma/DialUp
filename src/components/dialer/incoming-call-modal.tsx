// components/dialer/incoming-call-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, PhoneOff, User, MapPin, Clock } from 'lucide-react'

export function IncomingCallModal() {
  const { incomingConnection, isRinging, acceptCall, rejectCall } = useDialer()
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRinging) {
      setCallDuration(0)
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRinging])

  if (!incomingConnection || !isRinging) return null

  const callerNumber = incomingConnection.parameters?.From || 'Unknown Number'
  const callerName = incomingConnection.parameters?.FromCity || 'Unknown Caller'
  const callerLocation = incomingConnection.parameters?.FromState || incomingConnection.parameters?.FromCountry || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 to-blue-900 border-white/20 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardContent className="p-8 text-center">
          {/* Incoming Call Animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-green-500/30 rounded-full animate-ping animation-delay-75"></div>
            <Avatar className="relative h-24 w-24 mx-auto ring-4 ring-green-400/50">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
            <p className="text-xl text-white/90 font-semibold mb-1">{callerName}</p>
            <p className="text-lg text-white/70 mb-2">{callerNumber}</p>
            {callerLocation && (
              <div className="flex items-center justify-center text-white/60 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {callerLocation}
              </div>
            )}
          </div>

          {/* Call Duration */}
          <div className="flex items-center justify-center text-white/60 text-sm mb-6">
            <Clock className="h-4 w-4 mr-1" />
            Ringing for {callDuration}s
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-6">
            <Button
              onClick={rejectCall}
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            
            <Button
              onClick={acceptCall}
              className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          {/* Action Labels */}
          <div className="flex justify-center space-x-12 mt-3">
            <span className="text-red-300 text-sm">Decline</span>
            <span className="text-green-300 text-sm">Accept</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}