// src/components/dialer/TwilioProvider.tsx
// Fixed: Consolidated email sending to single point in disconnect handler.
// Integrated WhisperLive properly, removed duplicates, fixed recording upload.
// Ensured DB save includes recording URL and transcription.
// Added proper cleanup and error handling.
// Fixed TS errors: recordingUrl assignment, onSegments prop.

'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { Device } from "@twilio/voice-sdk"
import { useMediaRecorder } from '@/hooks/use-media-recorder'
import { WhisperLiveRecorder, WhisperLiveHandle } from '../notes/whisper-live-recorder'
import type { Segment } from '@/types/transcription'

declare global {
  interface Window {
    Twilio: any;
  }
}

type Codec = "opus" | "pcmu"

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
  status: () => string
}

interface EnhancedDialerContextProps {
  // Device state
  device: any | null
  isReady: boolean
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
  // Call state
  isCalling: boolean
  isOnHold: boolean
  isMuted: boolean
  isRecording: boolean
  callSeconds: number
  currentConnection: TwilioConnection | null

  setLiveTranscription: React.Dispatch<React.SetStateAction<string>>

  userProfile: { email: string; phone: string } | null

  // Audio controls
  speakerVolume: number
  setSpeakerVolume: (volume: number) => void
  micVolume: number
  setMicVolume: (volume: number) => void
  isSpeakerOn: boolean
  toggleSpeaker: () => void
  lastRecording: string | null

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
  finalTranscript: string
  isTranscribing: boolean
  liveSegments: Segment[] // <-- Added this line

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

const EnhancedDialerContext = createContext<EnhancedDialerContextProps | undefined>(undefined)

export const useDialer = () => {
  const ctx = useContext(EnhancedDialerContext)
  if (!ctx) {
    console.warn("useDialer called outside provider")
    return {} as EnhancedDialerContextProps
  }
  return ctx
}


export const TwilioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Device state
  const [device, setDevice] = useState<any | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')

  // Call state
  const [isCalling, setIsCalling] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [currentConnection, setCurrentConnection] = useState<TwilioConnection | null>(null)

  // Audio controls
  const [speakerVolume, setSpeakerVolume] = useState(0.8)
  const [micVolume, setMicVolume] = useState(0.8)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)

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
  const [finalTranscript, setFinalTranscript] = useState('') // <-- move here


  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const currentCallStartTime = useRef<Date | null>(null)
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const whisperRef = useRef<WhisperLiveHandle>(null)

  // Initialize ringtone
  useEffect(() => {
    ringtoneRef.current = new Audio('/ringtone.mp3')
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
    console.log(`[${type.toUpperCase()}] ${now}: ${message}`)
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

  const { state, startRecording, stopRecording } = useMediaRecorder()

  const [userProfile, setUserProfile] = useState<{ email: string; phone: string } | null>(null)
  const [lastRecording, setLastRecording] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          setUserProfile({ email: data.email, phone: data.phone })
          log(`👤 Loaded user profile: ${data.email}`, "info")
        }
      } catch (err: any) {
        log("❌ Failed to load user profile", "error")
      }
    }
    loadProfile()
  }, [])

  async function sendToWhisper(blob: Blob): Promise<string> {
    try {
      const form = new FormData()
      form.append('audio', blob)
      const r = await fetch('/api/server/transcribe', { method: 'POST', body: form })
      if (!r.ok) throw new Error('Whisper failed')
      const { text } = await r.json()
      return text
    } catch (e) {
      log('❌ Whisper transcription failed', 'error')
      return ''
    }
  }

  const startCallFeatures = () => {
    startRecording();

    const tryConnect = (attempts = 0) => {
      if (whisperRef.current) {
        whisperRef.current.connect();
        whisperRef.current.startTranscription();
        setIsTranscribing(true);
        log('🟢 Whisper connected + transcription started', 'info');
      } else if (attempts < 5) {
        setTimeout(() => tryConnect(attempts + 1), 500);
      }
    };

    tryConnect();
    setIsRecording(true);
  };


  const stopCallFeatures = async () => {
    const blob = await stopRecording()
    if (whisperRef.current) {
      whisperRef.current.stopTranscription()
      whisperRef.current.disconnect()
    }
    setIsRecording(false)
    setIsTranscribing(false)

    // Upload recording if available
    let recordingUrl: string | null = lastRecording
    if (blob && !lastRecording) {
      try {
        const form = new FormData()
        form.append("file", blob, `${Date.now()}.mp3`)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json())
        if (uploadRes.url) {
          recordingUrl = uploadRes.url
          setLastRecording(uploadRes.url)
          log('📁 Recording uploaded successfully', 'info')
        }
      } catch (err: any) {
        log(`❌ Recording upload failed: ${err.message}`, 'error')
      }
    }

    // Get Whisper recordings if available
    let whisperRecordings: string[] = []
    if (whisperRef.current) {
      try {
        const recordings = await whisperRef.current.uploadRecordings()
        whisperRecordings = recordings.map(r => typeof r === 'string' ? r : r.url)
        log(`📁 Uploaded ${whisperRecordings.length} Whisper recordings`, 'info')
      } catch (err: any) {
        log(`❌ Whisper upload failed: ${err.message}`, 'error')
      }
    }

    return { recordingUrl, whisperRecordings }
  }

  // Consolidated email sender - called only once on hangup
  const sendAutomaticEmails = async (
    transcript: string,
    recordingUrl?: string,
    callerEmail?: string,
    receiverEmail?: string
  ) => {
    try {
      const response = await fetch('/api/send-automatic-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          callDuration: formatTime(callSeconds),
          callDate: new Date().toLocaleString(),
          callerNumber: currentConnection?.parameters?.From || 'Unknown',
          receiverNumber: currentConnection?.parameters?.To || 'Unknown',
          callerEmail: callerEmail || userProfile?.email,
          receiverEmail: receiverEmail || userProfile?.email
        })
      })

      if (response.ok) {
        log('📧 Automatic transcript emails sent successfully', 'info')
      } else {
        log('❌ Failed to send automatic transcript emails', 'error')
      }
    } catch (error: any) {
      log(`❌ Error sending automatic emails: ${error.message}`, 'error')
    }
  }

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    log(isSpeakerOn ? '📱 Switched to handset' : '🔊 Switched to speaker', 'info')
  }

  async function fetchToken() {
    try {
      const url = "/api/twilio-token"
      console.log("🔄 Fetching Twilio token from:", url)
      const res = await fetch(url)
      console.log("🔄 Response status:", res.status)

      if (!res.ok) {
        const errText = await res.text()
        console.error("❌ Token fetch failed:", res.status, errText)
        return null
      }

      const data = await res.json()
      console.log("✅ Token received")

      if (!data.token) {
        console.error("❌ No token field in response:", data)
        return null
      }

      return data.token
    } catch (err: any) {
      console.error("❌ Token fetch error:", err)
      return null
    }
  }

  // Helper to refresh token and update device
  async function refreshTwilioToken() {
    if (!device) return

    try {
      log("🔄 Refreshing Twilio token...", "info")
      const newToken = await fetchToken()

      if (newToken) {
        await device.updateToken(newToken)
        log("✅ Twilio token refreshed", "info")
      } else {
        log("❌ Failed to refresh Twilio token", "error")
      }
    } catch (err: any) {
      log(`❌ Token refresh error: ${err.message}`, "error")
    }
  }

  // Auto-refresh token every 50 minutes
  useEffect(() => {
    if (!device) return

    const interval = setInterval(() => {
      refreshTwilioToken()
    }, 50 * 60 * 1000) // 50 mins

    return () => clearInterval(interval)
  }, [device])

  // Initialize Twilio Device
  useEffect(() => {
    let mounted = true
    let initTimeout: NodeJS.Timeout | null = null

    const initializeDevice = async () => {
      try {
        log('🔄 Starting Twilio Device initialization...', 'info')

        // Wait for Twilio SDK to load
        if (!Device) {
          log("❌ Twilio Voice SDK not available", "error")
          return
        }

        // 1. Fetch Token
        const token = await fetchToken()
        if (!token || !mounted) {
          log("❌ Failed to fetch token or component unmounted", "error")
          return
        }

        log('✅ Token fetched successfully', 'info')

        // 2. Create Device
        let dev: any
        try {
          dev = new Device(token, {
            codecPreferences: ["opus", "pcmu"] as any,
            edge: "roaming",
            logLevel: 5,
          })
          log('✅ Device object created', 'info')
        } catch (err: any) {
          log(`❌ Device creation failed: ${err.message}`, 'error')
          return
        }

        if (!mounted) return

        // 3. Set up event listeners BEFORE registering

        dev.on("registered", () => {
          if (!mounted) return
          log("✅ Device REGISTERED", "info")
          setIsReady(true)
        })
        dev.on("ready", () => {
          if (!mounted) return
          log("✅ Device READY", "info")
          setIsReady(true)
        })

        dev.on("error", (e: any) => {
          if (!mounted) return
          log(`❌ Device error: ${e.message}`, 'error')
          setIsReady(false)
        })

        dev.on('unregistered', () => {
          if (!mounted) return
          log('❌ Device unregistered', 'error')
          setIsReady(false)
        })

        // --- Handle Outgoing / Active Call ---
        dev.on('connect', (call: any) => {
          if (!mounted) return
          log('📞 Call connected successfully', 'info')
          setIsCalling(true)
          setCurrentConnection(call as TwilioConnection)

          // Start call timer
          setCallSeconds(0)
          currentCallStartTime.current = new Date()
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => setCallSeconds(c => c + 1), 1000)

          // Auto-start recording and transcription
          startCallFeatures()

          // Monitor call quality
          call.on('warning', (name: string) => {
            if (name === 'high-rtt') setConnectionQuality('fair')
            else if (name === 'high-packet-loss') setConnectionQuality('poor')
            log(`⚠️ Call quality warning: ${name}`, 'warning')
          })

          call.on('warning-cleared', () => {
            setConnectionQuality('excellent')
            log('✅ Call quality improved', 'info')
          })
        })

        // --- Handle Call Disconnect (SINGLE POINT FOR HANGUP LOGIC) ---
        dev.on('disconnect', async (call: any) => {
          if (!mounted) return

          const duration = callSeconds
          const callSid = call.parameters?.CallSid

          // Stop features and get assets
          const { recordingUrl, whisperRecordings } = await stopCallFeatures()
          

          // Extract emails (fallback to profile or transcript)
          const transcriptText = finalTranscript || liveTranscription
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g
          const emails = transcriptText.match(emailRegex) || []
          const callerEmail = call.parameters?.CallerEmail || userProfile?.email || emails[0]
          const receiverEmail = call.parameters?.ReceiverEmail || userProfile?.email || emails[1] || emails[0]

          // Send emails ONCE here
          await sendAutomaticEmails(transcriptText, recordingUrl ?? undefined, callerEmail, receiverEmail)

          // Update recordings in DB
          if (callSid && (recordingUrl || whisperRecordings.length > 0)) {
            try {
              await fetch('/api/calls/recordings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callId: callSid,
                  recordings: [recordingUrl, ...whisperRecordings].filter(Boolean)
                })
              })
              log('💾 Recordings saved to DB', 'info')
            } catch (err: any) {
              log(`❌ Recordings save failed: ${err.message}`, 'error')
            }
          }

          // Create and save call record
          const callRecord: CallRecord = {
            id: callSid || Date.now().toString(),
            number: call.parameters?.To || call.parameters?.From || 'Unknown',
            direction: call.parameters?.To ? 'outbound' : 'inbound',
            duration,
            status: 'completed',
            timestamp: currentCallStartTime.current || new Date(),
            recording: recordingUrl ?? undefined,
            notes: callNotes,
            transcription: transcriptText,
          }

          try {
            await axios.post('/api/calls', callRecord)
            log('✅ Call saved to database', 'info')
          } catch (err: any) {
            log(`❌ Failed to save call: ${err.message}`, 'error')
          }

          setCallHistory(prev => [callRecord, ...prev])

          // Reset state
          setIsCalling(false)
          setCurrentConnection(null)
          setIsOnHold(false)
          setIsMuted(false)
          setCallNotes('')
          setLiveTranscription('')

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }

          const minutes = Math.floor(duration / 60)
          const seconds = duration % 60
          log(`📴 Call ended - Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`, 'info')
        })

        // --- Handle Incoming Call ---
        dev.on('incoming', (connection: any) => {
          if (!mounted) return

          const callerNumber = connection.parameters.From || "Unknown"
          const receiverEmail = userProfile?.email || "agent@unknown"
          const callerEmail = connection.parameters.CallerEmail || callerNumber
          log(`📥 Incoming from ${callerNumber} → user ${receiverEmail}`, "info")

          connection.parameters.ReceiverEmail = receiverEmail
          connection.parameters.CallerEmail = callerEmail

          setIncomingConnection(connection)
          setIsRinging(true)
          playRingtone()

          // Auto-reject after 30s
          const rejectTimeout = setTimeout(() => {
            if (connection.status() === 'pending') {
              connection.reject()
              setIncomingConnection(null)
              setIsRinging(false)
              stopRingtone()
              log('⏱️ Incoming call timed out (auto-rejected)', 'info')
            }
          }, 30000)

          // Clean up timeout if call is answered/rejected manually
          connection.on('accept', () => clearTimeout(rejectTimeout))
          connection.on('reject', () => clearTimeout(rejectTimeout))
          connection.on('cancel', () => clearTimeout(rejectTimeout))
        })

        // Handle call cancellation
        dev.on('cancel', (call: any) => {
          if (!mounted) return
          log('🚫 Call was canceled', 'info')
          setIncomingConnection(null)
          setIsRinging(false)
          stopRingtone()
        })

        // Additional event logging for debugging
        dev.on("warning", (w: any) => console.warn("⚠️ Warning:", w))
        dev.on("warning-cleared", (w: any) => console.log("✅ Warning cleared:", w))
        dev.on("reconnecting", () => console.warn("🔄 Device reconnecting..."))
        dev.on("reconnected", () => console.log("✅ Device reconnected"))

        // 4. Register Device
        try {
          await dev.register()
          log('✅ Device registered successfully', 'info')
        } catch (err: any) {
          log(`❌ Device registration failed: ${err.message}`, 'error')
          return
        }

        // Save Device
        if (mounted) {
          setDevice(dev)
          log('✅ Twilio Device setup completed', 'info')
        }

      } catch (err: any) {
        if (mounted) {
          log(`💥 Fatal error initializing device: ${err.message}`, 'error')
        }
      }
    }

    // Add a small delay to ensure DOM is ready
    initTimeout = setTimeout(initializeDevice, 100)

    // Cleanup on unmount
    return () => {
      mounted = false
      if (initTimeout) clearTimeout(initTimeout)
      if (timerRef.current) clearInterval(timerRef.current)
      if (transcriptionTimeoutRef.current) clearTimeout(transcriptionTimeoutRef.current)
      stopRingtone()
      if (device) {
        device.disconnectAll?.()
        device.unregister?.()
      }
      log('🧹 Cleanup: Device destroyed & connections closed', 'info')
    }
  }, []) // Empty dependency array

  // Actions
  const startCall = async (phoneNumber: string) => {
    if (!device || !isReady) {
      log("❌ Device not ready for calls", "error")
      return
    }

    // ✅ Expect already normalized input from UI
    let cleanNumber = phoneNumber.trim()

    // ✅ Ensure starts with +
    if (!cleanNumber.startsWith("+")) {
      log("❌ Invalid number, must include country code", "error")
      return
    }
    setIsCalling(true)

    console.log("📞 Attempting call to:", cleanNumber)
    log(`📞 Calling ${cleanNumber}...`, "info")
    if (!userProfile) {
      log("❌ No user profile loaded yet", "error")
      return
    }
    try {
      const call = await device.connect({
        params: {
          To: cleanNumber,
          CallerEmail: userProfile.email,
          CallerNumber: userProfile.phone,
        }
      })

      call.on("accept", () => {
        console.log("📲 Call accepted")
        log("📲 Call accepted", "info")
      })

      call.on("ringing", () => {
        console.log("🔔 Remote side ringing")
        log("🔔 Remote side ringing", "info")
      })

      call.on("error", (err: any) => {
        console.error("❌ Call error:", err)
        log(`❌ Call error: ${err.message}`, "error")
        setIsCalling(false)
        setCurrentConnection(null)
      })

    } catch (err: any) {
      console.error("❌ Error starting call:", err)
      log(`❌ Error starting call: ${err.message}`, "error")
      setIsCalling(false)
    }
  }


  const hangUp = () => {
    if (currentConnection) {
      currentConnection.disconnect()
      log('📴 Call ended by user', 'info')
    } else if (device) {
      device.disconnectAll()
    }

    if (incomingConnection) {
      incomingConnection.reject()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      log('📴 Incoming call rejected', 'info')
    }

    // Reset call state
    setIsCalling(false)
    setCurrentConnection(null)
  }

  const acceptCall = () => {
    if (incomingConnection) {
      incomingConnection.accept()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      log('✅ Incoming call accepted', 'info')

      // Start timer
      setCallSeconds(0)
      currentCallStartTime.current = new Date()
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => setCallSeconds(c => c + 1), 1000)
    }
  }

  const rejectCall = () => {
    if (incomingConnection) {
      incomingConnection.reject()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      log('❌ Incoming call rejected', 'info')
    }
  }

  const toggleMute = () => {
    if (currentConnection) {
      const newMuted = !isMuted
      currentConnection.mute(newMuted)
      setIsMuted(newMuted)
      log(newMuted ? '🔇 Call muted' : '🔊 Call unmuted', 'info')
    }
  }

  const toggleHold = async () => {
    if (!currentConnection) return

    const callSid = (currentConnection as any).parameters?.CallSid
    if (!callSid) {
      log('⚠️ No CallSid found for hold operation', 'error')
      return
    }

    try {
      const action = !isOnHold ? 'hold' : 'resume'
      const response = await fetch('/api/twilio/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSid,
          url: `/api/voice/${action}`
        }),
      })

      if (response.ok) {
        setIsOnHold(!isOnHold)
        log(!isOnHold ? '🎵 Call placed on hold' : '▶️ Call resumed', 'info')
      } else {
        log('❌ Hold operation failed', 'error')
      }
    } catch (err: any) {
      log(`❌ Hold toggle failed: ${err.message}`, 'error')
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
      setIsRecording(false)
      log('⏹️ Recording stopped', 'info')
    } else {
      startRecording()
      setIsRecording(true)
      log('🔴 Recording started', 'info')
    }
  }

  const toggleTranscription = () => {
    if (isTranscribing) {
      if (whisperRef.current) {
        whisperRef.current.stopTranscription()
        whisperRef.current.disconnect()
      }
      setIsTranscribing(false)
      log('📝 Live transcription stopped', 'info')
    } else {
      if (whisperRef.current) {
        whisperRef.current.connect()
        whisperRef.current.startTranscription()
      }
      setIsTranscribing(true)
      log('📝 Live transcription started', 'info')
    }
  }


  const sendDTMF = (digits: string) => {
    if (currentConnection) {
      currentConnection.sendDigits(digits)
      log(`🔢 Sent DTMF: ${digits}`, 'info')
    }
  }

  const transferCall = (number: string, type: 'blind' | 'warm') => {
    log(`🔄 ${type === 'blind' ? 'Blind' : 'Warm'} transfer to ${number}`, 'info')
    // TODO: Implement transfer logic
  }

  const startConference = (numbers: string[]) => {
    setConferenceParticipants(numbers)
    setIsInConference(true)
    log(`👥 Conference started with ${numbers.length} participants`, 'info')
    // TODO: Implement conference logic
  }

  const updateCallNotes = (notes: string) => {
    setCallNotes(notes)
  }

  const getCallStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysCalls = callHistory.filter(call =>
      new Date(call.timestamp) >= today
    ).length

    const totalCalls = callHistory.length
    const completedCalls = callHistory.filter(call => call.status === 'completed')

    const averageDuration = completedCalls.length > 0
      ? completedCalls.reduce((sum, call) => sum + call.duration, 0) / completedCalls.length
      : 0

    const successRate = totalCalls > 0
      ? (completedCalls.length / totalCalls) * 100
      : 0

    return {
      totalCalls,
      averageDuration: Math.round(averageDuration),
      successRate: Math.round(successRate),
      todaysCalls
    }
  }

  // Load call history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/calls')
        if (res.ok) {
          const history = await res.json()
          setCallHistory(history)
          log(`📊 Loaded ${history.length} call records`, 'info')
        }
      } catch (err: any) {
        log(`❌ Failed to load call history: ${err.message}`, 'error')
      }
    }
    if (isReady) loadHistory()
  }, [isReady])

  // inside TwilioProvider
  const seenSegmentsRef = useRef<Set<string>>(new Set())
  const [liveSegments, setLiveSegments] = useState<Segment[]>([])
  const handleWhisperSegments = (segments: Segment[]) => {
    const unique = segments.filter((s) => {
      const key = s.id || s.text || s.content
      if (!key || seenSegmentsRef.current.has(key.trim().toLowerCase())) return false
      seenSegmentsRef.current.add(key.trim().toLowerCase())
      return true
    })


    // when handling segments
    if (unique.length) {
      const joined = unique.map(s => s.text || s.content).join('\n')
      setLiveTranscription(prev => (prev ? prev + '\n' + joined : joined))
      setLiveSegments(prev => [...prev, ...unique])

      // build full transcript
      setFinalTranscript(prev => (prev ? prev + '\n' + joined : joined))
    }

  }

  return (
    <EnhancedDialerContext.Provider
      value={{
        device,
        isReady,
        connectionQuality,
        setLiveTranscription,
        finalTranscript,  
        liveSegments,
        userProfile,
        isCalling,
        isOnHold,
        isMuted,
        callSeconds,
        currentConnection,
        speakerVolume,
        setSpeakerVolume,
        micVolume,
        setMicVolume,
        isSpeakerOn,
        toggleSpeaker,
        incomingConnection,
        isRinging,
        conferenceParticipants,
        isInConference,
        callLog,
        callHistory,
        callNotes,
        lastRecording,
        isRecording,
        isTranscribing,
        liveTranscription,
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

      <WhisperLiveRecorder ref={whisperRef} onSegments={handleWhisperSegments} />




    </EnhancedDialerContext.Provider>
  )
}