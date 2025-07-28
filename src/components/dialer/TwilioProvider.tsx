// components/dialer/TwilioProvider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Device } from '@twilio/voice-sdk'

interface DialerContextProps {
  device: Device | null
  isCalling: boolean
  callSeconds: number
  callLog: { time: string; message: string }[]
  startCall: (number: string) => void
  hangUp: () => void
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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const log = (message: string) => {
    const now = new Date().toLocaleTimeString()
    setCallLog(prev => [{ time: now, message }, ...prev])
  }

  const fetchToken = async () => {
    const res = await fetch('/api/twilio-token', { credentials: 'include' })
    const { token } = await res.json()
    return token
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = await fetchToken()
        const dev = new Device(token, {
          codecPreferences: [Device.Codec.OPUS, Device.Codec.PCMU]
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

        if (mounted) setDevice(dev)
      } catch {
        log('Failed to initialize device')
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
  }

  return (
    <DialerContext.Provider
      value={{ device, isCalling, callSeconds, callLog, startCall, hangUp }}
    >
      {children}
    </DialerContext.Provider>
  )
}
