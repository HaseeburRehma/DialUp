'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Device, Call } from '@twilio/voice-sdk'

interface CallRecord {
  id: string
  number: string
  direction: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'busy' | 'no-answer' | 'failed'
  timestamp: Date
  recording?: string
  notes?: string
  transcription?: string
}

interface TwilioConnection {
  accept: () => void
  reject: () => void
  disconnect: () => void
  parameters: Record<string, any>
  mute: (muted: boolean) => void
  sendDigits: (digits: string) => void
}

interface DialerContextProps {
  // Device state
  device: Device | null
  isReady: boolean
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'

  // Call state
  isCalling: boolean
  isOnHold: boolean
  isMuted: boolean
  isRecording: boolean
  callSeconds: number
  currentConnection: TwilioConnection | null

  // Incoming calls
  incomingConnection: TwilioConnection | null
  isRinging: boolean

  // Conference & Transfer
  conferenceParticipants: string[]
  isInConference: boolean

  // Call management
  callLog: { time: string; message: string; type: 'info' | 'warning' | 'error' }[]
  callHistory: CallRecord[]
  callNotes: string

  // Real-time features
  liveTranscription: string
  isTranscribing: boolean

  // Actions
  startCall: (number: string) => void
  hangUp: () => void
  acceptCall: () => void
  rejectCall: () => void
  toggleMute: () => void
  toggleHold: () => void
  toggleRecording: () => void
  toggleTranscription: () => void
  sendDTMF: (digits: string) => void
  transferCall: (number: string, type: 'blind' | 'warm') => void
  startConference: (numbers: string[]) => void
  updateCallNotes: (notes: string) => void

  // Analytics
  getCallStats: () => {
    totalCalls: number
    averageDuration: number
    successRate: number
    todaysCalls: number
  }
}

const DialerContext = createContext<DialerContextProps | undefined>(undefined)
// Use the correct codec string values as per Twilio's SDK type definition

export const useDialer = () => {
  const ctx = useContext(DialerContext)
  if (!ctx) throw new Error('useDialer must be used within TwilioProvider')
  return ctx
}

export const TwilioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Device state
  const [device, setDevice] = useState<Device | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')

  // Call state
  const [isCalling, setIsCalling] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [currentConnection, setCurrentConnection] = useState<TwilioConnection | null>(null)

  // Incoming calls
  const [incomingConnection, setIncomingConnection] = useState<TwilioConnection | null>(null)
  const [isRinging, setIsRinging] = useState(false)

  // Conference & Transfer
  const [conferenceParticipants, setConferenceParticipants] = useState<string[]>([])
  const [isInConference, setIsInConference] = useState(false)

  // Call management
  const [callLog, setCallLog] = useState<{ time: string; message: string; type: 'info' | 'warning' | 'error' }[]>([])
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [callNotes, setCallNotes] = useState('')

  // Real-time features
  const [liveTranscription, setLiveTranscription] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const currentCallStartTime = useRef<Date | null>(null)

  // Initialize ringtone
  useEffect(() => {
    ringtoneRef.current = new Audio('/ringtone.mp3')  // ✅ absolute path from /public
    ringtoneRef.current.loop = true
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current = null
      }
    }
  }, [])

  const log = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const now = new Date().toLocaleTimeString()
    setCallLog(prev => [{ time: now, message, type }, ...prev.slice(0, 49)])
  }

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(e => console.warn('Could not play ringtone:', e))
    }
  }

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }

  async function fetchToken() {
    try {
      console.log("🔑 Fetching Twilio token...")
      const res = await fetch('/api/twilio-token', { credentials: 'include' })
      console.log("🔑 Response:", res.status)

      if (!res.ok) {
        const errText = await res.text()
        console.error('❌ Token fetch failed:', res.status, errText)
        return null
      }
      const data = await res.json()
      console.log("✅ Got token:", data?.token ? "yes" : "no")
      return data?.token || null
    } catch (err) {
      console.error('❌ Token fetch error:', err)
      return null
    }
  }


  // Initialize Twilio Device
// Initialize Twilio Device
useEffect(() => {
  let mounted = true

  ; (async () => {
    try {
      log('🔄 [Init] Starting Twilio Device initialization...', 'info')

      // 1. Fetch Token
      const token = await fetchToken()
      log(`Step 1️⃣ Token fetched: ${token ? '✅' : '❌ EMPTY'}`, 'info')
      if (!token || !mounted) return

      // 2. Create Device
      let dev: Device
      try {
        dev = new Device(token, {
          codecPreferences: ['opus', 'pcmu'] as Call.Codec[],
          logLevel: 3, // verbose Twilio internal logs
        })
        log('Step 2️⃣ Device object created ✅', 'info')
      } catch (err: any) {
        log(`Step 2️⃣ Device creation failed ❌: ${err.message}`, 'error')
        return
      }

      // 3. Register Device
      try {
        await dev.register()
        log('Step 3️⃣ Device.register() called ✅', 'info')
      } catch (err: any) {
        log(`Step 3️⃣ Device.register() failed ❌: ${err.message}`, 'error')
        return
      }

      // 4. Attach Events
      dev.on('registered', () => log('Step 4️⃣ ✅ Device registered with Twilio', 'info'))
      dev.on('unregistered', () => log('Step 4️⃣ ❌ Device unregistered', 'info'))
      dev.on('ready', () => {
        if (!mounted) return
        setIsReady(true)
        log('Step 4️⃣ Device ready - You can now make and receive calls ✅', 'info')
      })
      dev.on('error', (e: any) => log(`Step 4️⃣ Device error ❌: ${e.message}`, 'error'))

      // --- Handle Outgoing / Active Call ---
      dev.on('connect', (connection: any) => {
        if (!mounted) return
        setIsCalling(true)
        setCurrentConnection(connection as TwilioConnection)

        setCallSeconds(0)
        currentCallStartTime.current = new Date()
        timerRef.current = setInterval(() => setCallSeconds(c => c + 1), 1000)

        log('📞 Call connected ✅', 'info')

        // Monitor quality
        connection.on('warning', (name: string) => {
          if (name === 'high-rtt') setConnectionQuality('fair')
          else if (name === 'high-packet-loss') setConnectionQuality('poor')
        })
        connection.on('warning-cleared', () => {
          setConnectionQuality('excellent')
        })
      })

      // --- Handle Call Disconnect ---
      dev.on('disconnect', (connection: any) => {
        if (!mounted) return

        const duration = callSeconds
        const callRecord: CallRecord = {
          id: Date.now().toString(),
          number: connection.parameters?.To || connection.parameters?.From || 'Unknown',
          direction: connection.parameters?.To ? 'outbound' : 'inbound',
          duration,
          status: 'completed',
          timestamp: currentCallStartTime.current || new Date(),
          notes: callNotes
        }

        setCallHistory(prev => [callRecord, ...prev])
        setIsCalling(false)
        setCurrentConnection(null)
        setIsOnHold(false)
        setIsMuted(false)
        setIsRecording(false)
        setCallNotes('')
        setLiveTranscription('')
        setIsTranscribing(false)

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        log(`📴 Call ended - Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, 'info')
      })

      // --- Handle Incoming Call ---
      dev.on('incoming', (connection: any) => {
        if (!mounted) return

        const callerNumber = connection.parameters.From || 'Unknown Number'
        log(`📥 Incoming call from ${callerNumber}`, 'info')

        setIncomingConnection(connection)
        setIsRinging(true)
        playRingtone()

        // Auto-reject after 30s
        setTimeout(() => {
          if (connection.status() === 'pending') {
            connection.reject()
            setIncomingConnection(null)
            setIsRinging(false)
            stopRingtone()
            log('⏱️ Incoming call timed out (auto-rejected)', 'info')
          }
        }, 30000)
      })

      // Save Device
      if (mounted) {
        setDevice(dev)
        log('✅ Twilio Device setup completed successfully', 'info')
      }

    } catch (err: any) {
      log(`💥 Fatal error initializing device: ${err.message}`, 'error')
    }
  })()

  // Cleanup on unmount
  return () => {
    mounted = false
    if (timerRef.current) clearInterval(timerRef.current)
    stopRingtone()
    device?.disconnectAll()
    log('🧹 Cleanup: Device destroyed & connections closed', 'info')
  }
}, [])


  // Actions
  const startCall = (toNumber: string) => {
    if (!device || !toNumber.trim() || !isReady) return

    const cleanNumber = toNumber.trim()
    log(`Calling ${cleanNumber}...`, 'info')

    device.connect({
      params: {
        To: cleanNumber,
        Record: isRecording ? 'true' : 'false'
      }
    })
  }

  const hangUp = () => {
    if (currentConnection) {
      currentConnection.disconnect()
    } else {
      device?.disconnectAll()
    }

    if (incomingConnection) {
      incomingConnection.reject()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
    }
  }

  const acceptCall = () => {
    if (incomingConnection) {
      incomingConnection.accept()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      log('Incoming call accepted', 'info')
    }
  }

  const rejectCall = () => {
    if (incomingConnection) {
      incomingConnection.reject()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      log('Incoming call rejected', 'info')
    }
  }

  const toggleMute = () => {
    if (currentConnection) {
      const newMuted = !isMuted
      currentConnection.mute(newMuted)
      setIsMuted(newMuted)
      log(newMuted ? 'Call muted' : 'Call unmuted', 'info')
    }
  }

  const toggleHold = () => {
    // Note: Hold functionality would require server-side TwiML changes
    const newHold = !isOnHold
    setIsOnHold(newHold)
    log(newHold ? 'Call on hold' : 'Call resumed', 'info')
  }

  const toggleRecording = () => {
    const newRecording = !isRecording
    setIsRecording(newRecording)
    log(newRecording ? 'Recording started' : 'Recording stopped', 'info')
  }

  const toggleTranscription = () => {
    const newTranscribing = !isTranscribing
    setIsTranscribing(newTranscribing)
    log(newTranscribing ? 'Live transcription started' : 'Live transcription stopped', 'info')

    if (!newTranscribing) {
      setLiveTranscription('')
    }
  }

  const sendDTMF = (digits: string) => {
    if (currentConnection) {
      currentConnection.sendDigits(digits)
      log(`Sent DTMF: ${digits}`, 'info')
    }
  }

  const transferCall = (number: string, type: 'blind' | 'warm') => {
    log(`${type === 'blind' ? 'Blind' : 'Warm'} transfer to ${number}`, 'info')
    // Transfer logic would be implemented server-side
  }

  const startConference = (numbers: string[]) => {
    setConferenceParticipants(numbers)
    setIsInConference(true)
    log(`Conference started with ${numbers.length} participants`, 'info')
  }

  const updateCallNotes = (notes: string) => {
    setCallNotes(notes)
  }

  const getCallStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysCalls = callHistory.filter(call => call.timestamp >= today).length
    const totalCalls = callHistory.length
    const completedCalls = callHistory.filter(call => call.status === 'completed')
    const averageDuration = completedCalls.length > 0
      ? completedCalls.reduce((sum, call) => sum + call.duration, 0) / completedCalls.length
      : 0
    const successRate = totalCalls > 0 ? (completedCalls.length / totalCalls) * 100 : 0

    return {
      totalCalls,
      averageDuration: Math.round(averageDuration),
      successRate: Math.round(successRate),
      todaysCalls
    }
  }

  return (
    <DialerContext.Provider
      value={{
        // Device state
        device,
        isReady,
        connectionQuality,

        // Call state
        isCalling,
        isOnHold,
        isMuted,
        isRecording,
        callSeconds,
        currentConnection,

        // Incoming calls
        incomingConnection,
        isRinging,

        // Conference & Transfer
        conferenceParticipants,
        isInConference,

        // Call management
        callLog,
        callHistory,
        callNotes,

        // Real-time features
        liveTranscription,
        isTranscribing,

        // Actions
        startCall,
        hangUp,
        acceptCall,
        rejectCall,
        toggleMute,
        toggleHold,
        toggleRecording,
        toggleTranscription,
        sendDTMF,
        transferCall,
        startConference,
        updateCallNotes,
        getCallStats,
      }}
    >
      {children}
    </DialerContext.Provider>
  )
}