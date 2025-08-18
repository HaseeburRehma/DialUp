// components/dialer/TwilioProvider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Device } from '@twilio/voice-sdk'

interface TwilioConnection {
  accept: () => void
  reject: () => void
  disconnect: () => void
  parameters: Record<string, any>
}

interface DialerContextProps {
  device: Device | null
  isCalling: boolean
  callSeconds: number
  callLog: { time: string; message: string }[]
  callNotes: string
  incomingConnection: TwilioConnection | null
  startCall: (number: string) => void
  hangUp: () => void
  acceptCall: () => void
  rejectCall: () => void
  updateCallNotes: (text: string) => void
}

const DialerContext = createContext<DialerContextProps | undefined>(undefined)

export const useDialer = () => {
  const ctx = useContext(DialerContext)
  if (!ctx) throw new Error('useDialer must be used within TwilioProvider')
  return ctx
}

export const TwilioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [callLog, setCallLog] = useState<{ time: string; message: string }[]>([])
  const [callNotes, setCallNotes] = useState('')
  const [incomingConnection, setIncomingConnection] = useState<TwilioConnection | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const log = (message: string) => {
    const now = new Date().toLocaleTimeString()
    setCallLog(prev => [{ time: now, message }, ...prev])
  }

  async function fetchToken() {
    try {
      const res = await fetch('/api/twilio-token', { credentials: 'include' })
      if (!res.ok) {
        const errText = await res.text()
        console.error('Token fetch failed:', res.status, errText)
        return null
      }
      const data = await res.json()
      return data?.token || null
    } catch (err) {
      console.error('Token fetch error:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = await fetchToken()
        if (!token) return

        const dev = new Device(token, {
          codecPreferences: ['opus', 'pcmu'] as any,
        })

        dev.on('ready', () => log('Device ready'))
        dev.on('error', e => log(`Error: ${e.message}`))

        dev.on('connect', () => {
          if (!mounted) return
          setIsCalling(true)
          setCallSeconds(0)
          timerRef.current = setInterval(() => setCallSeconds(c => c + 1), 1000)
          log('Call connected')
        })

        dev.on('disconnect', () => {
          setIsCalling(false)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          log('Call ended')
        })

        dev.on('incoming', (connection: any) => {
          log(`Incoming call from ${connection.parameters.From || 'Unknown'}`)
          setIncomingConnection(connection)
        })

        if (mounted) setDevice(dev)
      } catch (err: any) {
        log(`Failed to initialize device: ${err.message}`)
      }
    })()

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
      device?.disconnectAll()
    }
  }, [])

  const startCall = (toNumber: string) => {
    if (!device || !toNumber.trim()) return
    log(`Calling ${toNumber}…`)
    device.connect({ params: { To: toNumber.trim() } })
  }

  const hangUp = () => {
    device?.disconnectAll()
    setIncomingConnection(null)
  }

  const acceptCall = () => {
    if (incomingConnection) {
      incomingConnection.accept()
      setIncomingConnection(null)
      log('Incoming call accepted')
    }
  }

  const rejectCall = () => {
    if (incomingConnection) {
      incomingConnection.reject()
      setIncomingConnection(null)
      log('Incoming call rejected')
    }
  }

  const updateCallNotes = (text: string) => setCallNotes(text)

  return (
    <DialerContext.Provider
      value={{
        device,
        isCalling,
        callSeconds,
        callLog,
        callNotes,
        incomingConnection,
        startCall,
        hangUp,
        acceptCall,
        rejectCall,
        updateCallNotes,
      }}
    >
      {children}
    </DialerContext.Provider>
  )
}
