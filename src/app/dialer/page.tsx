'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Phone, PhoneOff } from 'lucide-react'
import { Device } from '@twilio/voice-sdk'

export default function DialerPage() {
  const [toNumber, setToNumber] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  const [device, setDevice] = useState<Device | null>(null)
  const [callLog, setCallLog] = useState<{ time: string; message: string }[]>([])
  const [callSeconds, setCallSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const log = (message: string) => {
    const now = new Date().toLocaleTimeString()
    setCallLog(prev => [{ time: now, message }, ...prev])
  }

  const fetchToken = async () => {
    try {
      const response = await fetch('/api/server/twilio-token', {
        credentials: 'include'
      })
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Failed to fetch token:', error)
      throw error
    }
  }

  useEffect(() => {
    const initDevice = async () => {
      try {
        const token = await fetchToken()
        const newDevice = new Device(token, {
          codecPreferences: [Device.Codec.OPUS, Device.Codec.PCMU]
        })

        newDevice.on('ready', () => log('Device ready'))
        newDevice.on('error', (e) => log(`Error: ${e.message}`))
        newDevice.on('connect', () => {
          setIsCalling(true)
          setCallSeconds(0)
          timerRef.current = setInterval(() => {
            setCallSeconds(prev => prev + 1)
          }, 1000)
          log('Call connected')
        })
        newDevice.on('disconnect', () => {
          setIsCalling(false)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          log('Call ended')
        })

        setDevice(newDevice)
      } catch (error) {
        log('Failed to initialize device')
      }
    }

    initDevice()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startCall = () => {
    if (!device || !toNumber.trim()) return
    log(`Calling ${toNumber}...`)
    device.connect({
      params: { To: toNumber.trim() }
    })
  }

  const hangUp = () => {
    device?.disconnectAll()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              In-App Dialer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status & Timer */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isCalling 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {isCalling ? 'In Call' : 'Idle'}
              </span>
              {isCalling && (
                <span className="text-sm font-mono">{formatDuration(callSeconds)}</span>
              )}
            </div>

            {/* Number Input + Buttons */}
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startCall()}
                disabled={isCalling}
                className="flex-1"
              />
              {!isCalling ? (
                <Button
                  onClick={startCall}
                  disabled={!device || !toNumber.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={hangUp}
                  variant="destructive"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Call Log */}
            <div>
              <h3 className="font-medium mb-2">Call Log</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {callLog.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    No activity yet.
                  </p>
                ) : (
                  callLog.map((entry, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{entry.time}</span>
                      <span>{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}