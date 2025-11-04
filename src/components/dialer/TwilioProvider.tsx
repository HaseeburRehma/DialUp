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
  id: string;
  number: string;
  fromNumber: string,
  toNumber: string,
  direction: 'inbound' | 'outbound';
  duration: number;
  status: 'completed' | 'busy' | 'no-answer' | 'failed';
  timestamp: string | Date;
  recording?: string;
  recordings?: string[];
  notes?: string;
  transcription?: string;
  callerEmail?: string;
  receiverEmail?: string;
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
  startCall: (number: string, opts?: { callerEmail?: string; receiverEmail?: string }) => void
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
  const [finalTranscript, setFinalTranscript] = useState('')


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
  // inside TwilioProvider component (near other useEffects)
  useEffect(() => {
    // Single SSE connection for live transcripts
    const url = "/api/voice/stream"; // served by Next or Express; both are identical now
    const es = new EventSource(url, { withCredentials: false });

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as { id: string; speaker: string; content: string; final?: boolean };

        // Construct a Segment that your provider already understands
        const seg: Segment = {
          id: data.id,
          speaker: (data.speaker || "unknown") as any,
          text: data.content,
          content: data.content,
          isFinal: !!data.final,       // required
          timestamp: Date.now(),       // required number
          timestamps: [Date.now(), Date.now()],
        };

        // Reuse your existing handler to dedupe & append
        handleWhisperSegments([seg]);
      } catch (e) {
        console.warn("Bad SSE payload:", e);
      }
    };

    es.onerror = (e) => {
      console.warn("SSE error:", e);
    };

    return () => {
      try { es.close(); } catch { }
    };
  }, []); // mount once

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile", {
          credentials: "include",
        });

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

  const startCallFeatures = async () => {
    try {
      // start dual-source recording (mic + system)
      await startRecording();

      // wait a few hundred ms to let audio graph stabilize
      await new Promise(r => setTimeout(r, 500));

      // start WhisperLive transcription
      if (whisperRef.current) {
        whisperRef.current.connect();
        whisperRef.current.startTranscription();
        log('🧠 WhisperLive connected + transcription started (mic + system audio)', 'info');
      }

      setIsRecording(true);
      setIsTranscribing(true);
    } catch (err: any) {
      log(`❌ startCallFeatures failed: ${err.message}`, 'error');
    }
  };



  const stopCallFeatures = async (callId?: string) => {
    const blob = await stopRecording()
    if (!blob || blob.size < 1000) {
      log(" No audio data captured — skipping upload", "warning")
      return { recordingUrl: null }
    }
    if (whisperRef.current) {
      whisperRef.current.stopTranscription()
      whisperRef.current.disconnect()
    }
    setIsRecording(false)
    setIsTranscribing(false)

    // Upload recording if available
    // replace inside stopCallFeatures()
    let recordingUrl: string | null = lastRecording;

    if (blob && !lastRecording) {
      try {
        const form = new FormData();
        form.append('file', blob, `${Date.now()}-blob.wav`);
        if (callId) form.append('callId', callId);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form
        });
        const data = await uploadRes.json();
        recordingUrl = data.url;
        setLastRecording(recordingUrl);
        log('📁 Recording uploaded successfully', 'info');
      } catch (err: any) {
        log(`❌ Recording upload failed: ${err.message}`, 'error');
      }
    }

    return { recordingUrl };
  };





  // Consolidated email sender - called only once on hangup
  // TwilioProvider.tsx (sendAutomaticEmails)
  const sendAutomaticEmails = async (
    transcript: string,
    recordingUrl?: string,
    callerEmail?: string,
    receiverEmail?: string
  ) => {
    if (!transcript || !transcript.trim()) {
      log('⚠️ Skipping email — no transcript available', 'warning');
      return;
    }
    try {
      const payload = {
        transcript,
        recordingUrl,
        callDuration: formatTime(callSeconds),
        callDate: new Date().toLocaleString(),
        callerNumber:
          currentConnection?.parameters?.CallerNumber ||
          currentConnection?.parameters?.From ||
          'Unknown',
        receiverNumber:
          currentConnection?.parameters?.To ||
          currentConnection?.parameters?.ReceiverNumber ||
          'Unknown',
        callerEmail:
          callerEmail ||
          currentConnection?.parameters?.CallerEmail ||
          userProfile?.email,
        receiverEmail:
          receiverEmail ||
          currentConnection?.parameters?.ReceiverEmail ||
          userProfile?.email,
      };

      const res = await fetch('/api/send-automatic-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        log(`❌ Email API failed [${res.status}]: ${body?.error || 'unknown error'}`, 'error')
        if (body?.failed?.length) log(`⚠️ Failed recipients: ${body.failed.join(', ')}`, 'warning')
      } else {
        const sentTo = body?.sent?.length ? body.sent.join(', ') : 'unknown'
        log(`📧 Transcript emailed successfully to: ${sentTo}`, 'info')
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


  async function finalizeCall(call: any) {
    // --- Guard: prevent double-finalization ---
    if ((call as any)._finalized) {
      log("⚠️ finalizeCall() skipped — already finalized", "warning");
      return;
    }
    (call as any)._finalized = true;

    log('📴 Finalizing call (shared helper)...', 'info');

    const duration = callSeconds;
    const callSid = call.parameters?.CallSid;

    // Pull email metadata
    const emailMetadata = (call as any)._emailMetadata || {};
    const callerEmail = emailMetadata.callerEmail || call.parameters?.CallerEmail || userProfile?.email;
    const receiverEmail = emailMetadata.receiverEmail || call.parameters?.ReceiverEmail || userProfile?.email;

    // --- Stop recording + transcription ---
    const { recordingUrl } = await stopCallFeatures((call as any)._dbId);

    // --- Grace delay to allow Whisper WebSocket close ---
    await new Promise(r => setTimeout(r, 1200));

    // --- Upload Whisper recordings and gather transcript ---
    let transcriptText = finalTranscript || liveTranscription || '';
    let whisperUrls: string[] = [];

    if (whisperRef.current) {
      try {
        await whisperRef.current.stopTranscription();

        const recs = await whisperRef.current.uploadRecordings();

        whisperUrls = recs.map((r: any) => (typeof r === 'string' ? r : r.url));

        const texts = recs.map((r: any) => r.transcription || r.text || '').filter(Boolean);
        if (texts.length) transcriptText = texts.join('\n');

        log(`📝 Final transcript built: ${transcriptText.split('\n').length} lines`, 'info');
      } catch (e: any) {
        log(`❌ Whisper upload failed: ${e.message}`, 'error');
      }
    }

    // --- Format transcript with speaker tags if available ---
    const formattedTranscript =
      liveSegments.length
        ? liveSegments
          .map(seg => `[${(seg.speaker || 'speaker').toString().toUpperCase()}]: ${seg.content || seg.text || ''}`.trim())
          .filter(Boolean)
          .join('\n')
        : transcriptText;
    // --- Send automatic emails ---
    try {
      await sendAutomaticEmails(
        formattedTranscript,
        recordingUrl ?? undefined,
        callerEmail,
        receiverEmail
      );
      log('📧 Transcript emailed successfully', 'info');
    } catch (e: any) {
      log(`⚠️ Email send failed: ${e.message}`, 'warning');
    }

    // --- Save to DB ---
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://voiceai.wordpressstagingsite.com";

    const allRecordings = [...new Set(
      [recordingUrl, ...whisperUrls]
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
        .map(u => u.startsWith('http') ? u : `${baseUrl}${u.startsWith('/') ? u : `/${u}`}`)
    )];

    const callRecord: CallRecord = {
      id: callSid || Date.now().toString(),
      number: call.parameters?.To || call.parameters?.From || 'Unknown',
      fromNumber: call.parameters?.From,
      toNumber: call.parameters?.To,
      direction: call.parameters?.To ? 'outbound' : 'inbound',
      duration,
      status: 'completed',
      timestamp: currentCallStartTime.current || new Date(),
      recording: allRecordings[0],
      recordings: allRecordings,
      notes: callNotes,
      transcription: formattedTranscript,
      callerEmail,
      receiverEmail,
    };

    try {
      if ((call as any)._dbId) {
        await axios.patch(`/api/calls/${(call as any)._dbId}`, callRecord, { withCredentials: true });
        // --- Attach Whisper recordings ---
        if (whisperUrls.length && (call as any)._dbId) {
          try {
            await axios.post('/api/calls/recordings', {
              callId: (call as any)._dbId,
              recordings: {
                urls: whisperUrls,
                transcription: formattedTranscript,
              },
            });
            log(`💾 Whisper recordings linked to call ${(call as any)._dbId}`, 'info');
          } catch (err: any) {
            log(`❌ Failed to link Whisper recordings: ${err.message}`, 'error');
          }
        }

        log('💾 Call updated in DB', 'info');
      } else {
        const res = await axios.post('/api/calls', callRecord, { withCredentials: true });
        log(`💾 Call saved to DB: ${res.data.call._id}`, 'info');
      }
    } catch (err: any) {
      log(`❌ DB save failed: ${err.message}`, 'error');
    }

    // --- Cleanup AFTER saving ---
    setCallHistory(prev => [callRecord, ...prev]);
    setIsCalling(false);
    setCurrentConnection(null);
    setIsOnHold(false);
    setIsMuted(false);
    setCallNotes('');
    setLiveTranscription('');
    setLiveSegments([]);
    if (timerRef.current) clearInterval(timerRef.current);

    log(`✅ Call finalized: ${duration}s`, 'info');
  }


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
        dev.on('connect', async (call: any) => {
          if (!mounted) return
          log('📞 Call connected successfully', 'info')
          setIsCalling(true)
          setCurrentConnection(call as TwilioConnection)
          const newCall = {
            number: call.parameters?.To || call.parameters?.From || 'Unknown',
            direction: call.parameters?.To ? 'outbound' : 'inbound',
            status: 'in-progress',
            duration: 0,
            timestamp: new Date(),
          };

          try {
            const res = await axios.post('/api/calls', newCall, { withCredentials: true });

            log(`💾 Call started and saved to DB: ${res.data.call._id}`, 'info');
            (call as any)._dbId = res.data.call._id; // keep ref for update later
          } catch (err: any) {
            log(`❌ Failed to save initial call: ${err.message}`, 'error');
          }
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
          call.on('disconnect', async () => {
            log('📴 Connection disconnect detected — finalizing...', 'info')
            await finalizeCall(call)
          })
        })

        {/*}
        // --- Handle Call Disconnect (SINGLE POINT FOR HANGUP LOGIC) ---
        dev.on('disconnect', async (call: any) => {
          if (!mounted) return;
          const duration = callSeconds;
          const callSid = call.parameters?.CallSid;

          log('📴 Call disconnect detected — finalizing...', 'info');

          // Get stored email metadata
          const emailMetadata = (call as any)._emailMetadata || {};
          const callerEmail = emailMetadata.callerEmail || call.parameters?.CallerEmail || userProfile?.email;
          const receiverEmail = emailMetadata.receiverEmail || call.parameters?.ReceiverEmail || userProfile?.email;

          // Stop recording + transcription
          const { recordingUrl } = await stopCallFeatures();

          // Get final transcript from Whisper
          let transcriptText = finalTranscript || liveTranscription || '';
          let whisperUrls: string[] = [];

          if (whisperRef.current) {
            try {
              await whisperRef.current.stopTranscription();
              await new Promise((r) => setTimeout(r, 1000));

              const recs = await whisperRef.current.uploadRecordings();
              whisperUrls = recs.map((r: any) => (typeof r === 'string' ? r : r.url));

              const texts = recs.map((r: any) => r.transcription || r.text || '').filter(Boolean);
              if (texts.length) transcriptText = texts.join('\n');

              log(`📝 Final transcript: ${transcriptText.split('\n').length} lines`, 'info');
            } catch (e: any) {
              log(`❌ Whisper upload failed: ${e.message}`, 'error');
            }
          }

          // Format transcript with speaker labels
          const formattedTranscript = liveSegments
            .map(seg => `[${seg.speaker.toUpperCase()}]: ${seg.content}`)
            .join('\n') || transcriptText;

          // Send emails with formatted transcript
          try {
            await sendAutomaticEmails(
              formattedTranscript,
              recordingUrl ?? undefined,
              callerEmail,
              receiverEmail
            );
            log('📧 Transcript emails sent successfully', 'info');
          } catch (e: any) {
            log(`⚠️ Email send failed: ${e.message}`, 'warning');
          }

          // Save to database
          const allRecordings = [recordingUrl, ...whisperUrls].filter(
            (u): u is string => typeof u === 'string' && u.length > 0
          );

          const callRecord: CallRecord = {
            id: callSid || Date.now().toString(),
            number: call.parameters?.To || call.parameters?.From || 'Unknown',
            direction: call.parameters?.To ? 'outbound' : 'inbound',
            duration,
            status: 'completed',
            timestamp: currentCallStartTime.current || new Date(),
            recording: allRecordings[0],
            notes: callNotes,
            transcription: formattedTranscript,
            callerEmail,
            receiverEmail,
          };

          try {
            if ((call as any)._dbId) {
              await axios.patch(`/api/calls/${(call as any)._dbId}`, callRecord);
              log('💾 Call updated in DB', 'info');
            } else {
              const res = await axios.post('/api/calls', callRecord, { withCredentials: true });
              log(`💾 Call saved to DB: ${res.data.call._id}`, 'info');
            }
          } catch (err: any) {
            log(`❌ DB save failed: ${err.message}`, 'error');
          }

          // Clean up state
          setCallHistory((p) => [callRecord, ...p]);
          setIsCalling(false);
          setCurrentConnection(null);
          setIsOnHold(false);
          setIsMuted(false);
          setCallNotes('');
          setLiveTranscription('');
          setLiveSegments([]);
          if (timerRef.current) clearInterval(timerRef.current);

          log(`✅ Call finalized: ${duration}s`, 'info');
        });
*/}
        dev.on('disconnect', async (call: any) => {
          log('📴 Device-level disconnect detected — finalizing...', 'info');
          await finalizeCall(call);
        });
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
  // TwilioProvider.tsx
  const startCall = async (phoneNumber: string, opts?: { callerEmail?: string; receiverEmail?: string }) => {
    if (!device || !isReady) {
      log("❌ Device not ready for calls", "error");
      return;
    }

    let cleanNumber = phoneNumber.trim();
    if (!cleanNumber.startsWith("+")) {
      log("❌ Invalid number, must include country code", "error");
      return;
    }

    if (!userProfile) {
      log("❌ No user profile loaded yet", "error");
      return;
    }

    try {
      // Determine emails
      const callerEmail = opts?.callerEmail || userProfile.email;
      const receiverEmail = opts?.receiverEmail || userProfile.email;

      log(`📞 Starting call: ${cleanNumber}`, 'info');
      log(`📧 Emails - Caller: ${callerEmail}, Receiver: ${receiverEmail}`, 'info');

      const call = await device.connect({
        params: {
          To: cleanNumber,
          CallerEmail: callerEmail,
          ReceiverEmail: receiverEmail,
          CallerNumber: userProfile.phone,
        }
      });
      (call as any).parameters = {
        ...call.parameters,
        To: cleanNumber,
        From: userProfile?.phone || "Unknown",
        CallerNumber: userProfile.phone,
      }
      setCurrentConnection(call as TwilioConnection);
      setIsCalling(true);
      setCallSeconds(0);
      currentCallStartTime.current = new Date();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallSeconds((c) => c + 1), 1000);
      call.on("accept", () => log("📲 Call accepted", "info"));
      call.on("ringing", () => log("🔔 Remote side ringing", "info"));
      call.on("error", (err: any) => {
        log(`❌ Call error: ${err.message}`, "error");
        setIsCalling(false);
        setCurrentConnection(null);
      });


      // Store emails in connection object for later use
      (call as any)._emailMetadata = {
        callerEmail,
        receiverEmail,
        callerNumber: userProfile.phone,
        receiverNumber: cleanNumber,
      };

    } catch (err: any) {
      log(`❌ Error starting call: ${err.message}`, "error");
      setIsCalling(false);
    }
  };



  const hangUp = async () => {
    if (currentConnection) {
      log('📴 Call ended by user', 'info');
      const callCopy = currentConnection;
      currentConnection.disconnect(); // triggers Twilio disconnect
      await finalizeCall(callCopy);   // <--- force finalize immediately
    } else if (device) {
      device.disconnectAll();
    }

    if (incomingConnection) {
      incomingConnection.reject();
      setIncomingConnection(null);
      setIsRinging(false);
      stopRingtone();
      log('📴 Incoming call rejected', 'info');
    }

    setIsCalling(false);
    setCurrentConnection(null);
  };


  const acceptCall = () => {
    if (incomingConnection) {
      incomingConnection.accept()
      setIncomingConnection(null)
      setIsRinging(false)
      stopRingtone()
      startCallFeatures();

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
      log(' No CallSid found for hold operation', 'error')
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
        log(!isOnHold ? 'Call placed on hold' : ' Call resumed', 'info')
      } else {
        log(' Hold operation failed', 'error')
      }
    } catch (err: any) {
      log(` Hold toggle failed: ${err.message}`, 'error')
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
      setIsRecording(false)
      log(' Recording stopped', 'info')
    } else {
      startRecording()
      setIsRecording(true)
      log(' Recording started', 'info')
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
  // Load call history on mount with normalization
  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (isReady) {
          const res = await fetch('/api/calls');
          if (res.ok) {
            const history = await res.json();
            const normalized: CallRecord[] = history.map((c: any) => ({
              id: c.id ?? c._id ?? String(c.callSid ?? Date.now()),
              number: c.number ?? 'Unknown',
              fromNumber: c.parameters?.From,
              toNumber: c.parameters?.To,
              direction: c.direction ?? 'outbound',
              duration: Number(c.duration ?? 0),
              status: c.status ?? 'completed',
              timestamp: c.timestamp ?? new Date().toISOString(),
              recording:
                c.recording ??
                (Array.isArray(c.recordings) ? c.recordings[0] : undefined),
              recordings: Array.isArray(c.recordings) ? c.recordings : [],
              notes: c.notes ?? '',
              transcription: c.transcription ?? '',
              callerEmail: c.callerEmail,
              receiverEmail: c.receiverEmail,
            }));
            setCallHistory(normalized);
            log(`📊 Loaded ${normalized.length} call records`, 'info');
          }
        }
      } catch (err: any) {
        log(`❌ Failed to load call history: ${err.message}`, 'error');
      }
    };

    loadHistory();
  }, [isReady]);


  // inside TwilioProvider
  const seenSegmentsRef = useRef<Set<string>>(new Set())
  const [liveSegments, setLiveSegments] = useState<Segment[]>([])
  const handleWhisperSegments = (segments: Segment[]) => {
    const unique = segments.filter((s) => {
      const key = (s.id || s.text || s.content || '').trim().toLowerCase();
      if (!key || seenSegmentsRef.current.has(key)) return false;
      seenSegmentsRef.current.add(key);
      return true;
    });

    if (unique.length) {
      const joined = unique.map(s => s.text || s.content || '').filter(Boolean).join('\n');
      if (joined) {
        setLiveTranscription(prev => (prev ? prev + '\n' + joined : joined));
        setLiveSegments(prev => [...prev, ...unique]);
        setFinalTranscript(prev => (prev ? prev + '\n' + joined : joined));
      }
    }
  };


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