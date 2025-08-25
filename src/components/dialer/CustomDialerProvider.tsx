// src/components/dialer/CustomDialerProvider.tsx

'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { UserAgent, Registerer, Inviter, Invitation, Session, SessionState, URI } from "sip.js";

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

interface CustomConnection {
    accept: () => void
    reject: () => void
    disconnect: () => void
    parameters: Record<string, any>
    mute: (muted: boolean) => void
    sendDigits: (digits: string) => void
}

interface DialerContextProps {
    // Device state
    ua: UserAgent | null
    isReady: boolean
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
    userPhone: string | null

    // Call state
    isCalling: boolean
    isOnHold: boolean
    isMuted: boolean
    isRecording: boolean
    callSeconds: number
    currentConnection: CustomConnection | null

    // Incoming calls
    incomingConnection: CustomConnection | null
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

export const useDialer = () => {
    const ctx = useContext(DialerContext)
    if (!ctx) throw new Error('useDialer must be used within CustomDialerProvider')
    return ctx
}

export const CustomDialerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    // Device state
    const [ua, setUA] = useState<UserAgent | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')
    const [userPhone, setUserPhone] = useState<string | null>(null)

    // Call state
    const [isCalling, setIsCalling] = useState(false)
    const [isOnHold, setIsOnHold] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [callSeconds, setCallSeconds] = useState(0)
    const [currentConnection, setCurrentConnection] = useState<CustomConnection | null>(null)

    // Incoming calls
    const [incomingConnection, setIncomingConnection] = useState<CustomConnection | null>(null)
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
    const currentSession = useRef<Session | null>(null)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const recognitionRef = useRef<any>(null)

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
        setCallLog(prev => [{ time: now, message, type }, ...prev.slice(0, 49)])
        console.log(`[${type.toUpperCase()}] ${message}`)
    }

    const playRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.play().catch(e => log('Could not play ringtone', 'warning'))
        }
    }

    const stopRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause()
            ringtoneRef.current.currentTime = 0
        }
    }

    // Fetch user's phone number from session/API
    const fetchUserPhone = async () => {
        try {
            const response = await fetch('/api/user/profile')
            if (response.ok) {
                const userData = await response.json()
                setUserPhone(userData.phone)
                log(`User phone loaded: ${userData.phone}`, 'info')
                return userData.phone
            }
        } catch (error) {
            log('Failed to fetch user phone number', 'error')
        }
        return null
    }

    // Initialize WebRTC User Agent
    useEffect(() => {
        let mounted = true

        const initializeUA = async () => {
            try {
                log('🔄 Initializing Custom WebRTC Dialer...', 'info')

                // Get user's phone number
                const phone = await fetchUserPhone()
                if (!phone || !mounted) {
                    log('❌ No phone number found for user', 'error')
                    return
                }

                // WebRTC configuration
                const { URI } = require('sip.js')
                const configuration = {
                    uri: UserAgent.makeURI(
                        `sip:${phone}@${process.env.NEXT_PUBLIC_SIP_DOMAIN}`
                    )!,
                    transportOptions: {
                        server: process.env.NEXT_PUBLIC_SIP_WEBSOCKET_URL!,
                    },
                    authorizationUsername: phone.replace(/\D/g, ''),
                    authorizationPassword: process.env.NEXT_PUBLIC_SIP_PASSWORD!,
                    displayName: phone,
                    sessionDescriptionHandlerFactoryOptions: {
                        constraints: { audio: true, video: false },
                        peerConnectionOptions: {
                            rtcConfiguration: {
                                iceServers: [
                                    { urls: 'stun:stun.l.google.com:19302' },
                                    { urls: 'stun:stun1.l.google.com:19302' },
                                ],
                            },
                        },
                    },
                }



                // Create User Agent

                const userAgent = new UserAgent(configuration)
                const registerer = new Registerer(userAgent);
                await registerer.register();
                // Register event handlers using delegate pattern
                userAgent.delegate = {
                    onConnect: () => {
                        log('✅ Connected to SIP server', 'info')
                        setIsReady(true)
                    },
                    onDisconnect: () => {
                        log('📴 Disconnected from SIP server', 'warning')
                        setIsReady(false)
                    },
                    onRegister: () => {
                        log('✅ Successfully registered with SIP server', 'info')
                    },
                    onInvite: (invitation: Invitation) => {
                        log(`📥 Incoming call from ${invitation.remoteIdentity?.displayName || invitation.remoteIdentity?.uri}`, 'info')

                        const connectionWrapper: CustomConnection = {
                            accept: () => {
                                invitation.accept();
                                currentSession.current = invitation;
                                setupCallEvents(invitation);
                            },
                            reject: () => invitation.reject(),
                            disconnect: () => invitation.dispose(),
                            parameters: {
                                From: invitation.remoteIdentity.uri.toString(),
                                CallerName: invitation.remoteIdentity.displayName || "Unknown Caller"
                            },
                            mute: (muted: boolean) => {
                                const pc = (invitation.sessionDescriptionHandler as any)?.peerConnection;
                                if (pc) {
                                    pc.getSenders().forEach((sender: RTCRtpSender) => {
                                        if (sender.track && sender.track.kind === "audio") {
                                            sender.track.enabled = !muted;
                                        }
                                    });
                                }
                            },
                            sendDigits: (digits: string) => {
                                const sdh = (invitation.sessionDescriptionHandler as any);
                                if (sdh && typeof sdh.sendDtmf === 'function') {
                                    sdh.sendDtmf(digits);
                                } else {
                                    log('DTMF not supported on this session', 'warning');
                                }
                            }
                        };

                        setIncomingConnection(connectionWrapper);
                        setIsRinging(true);
                        playRingtone();

                        setTimeout(() => {
                            if (isRinging) {
                                invitation.reject();
                                setIncomingConnection(null);
                                setIsRinging(false);
                                stopRingtone();
                                log("⏱️ Incoming call timed out", "info");
                            }
                        }, 30000);
                    }
                };

                if (mounted) {
                    setUA(userAgent)

                    // Start the UA
                    userAgent.start().catch((error: any) => {
                        log(`❌ Failed to start UA: ${error.message}`, 'error')
                    })
                }

            } catch (error: any) {
                log(`💥 Fatal error initializing dialer: ${error.message}`, 'error')
            }
        }

        initializeUA()

        return () => {
            mounted = false
            if (timerRef.current) clearInterval(timerRef.current)
            stopRingtone()
            if (ua) {
                ua.stop()
            }
            log('🧹 Cleanup: Dialer destroyed', 'info')
        }
    }, [])

    const setupCallEvents = (session: Session) => {
        session.stateChange.addListener((newState) => {
            if (newState === SessionState.Established) {
                log('📞 Call connected successfully', 'info')
                setIsCalling(true)

                // Start call timer
                setCallSeconds(0)
                currentCallStartTime.current = new Date()
                timerRef.current = setInterval(() => setCallSeconds(c => c + 1), 1000)

                // Monitor connection quality
                const pc = (session.sessionDescriptionHandler as any)?.peerConnection
                if (pc) {
                    pc.oniceconnectionstatechange = () => {
                        switch (pc.iceConnectionState) {
                            case 'connected':
                            case 'completed':
                                setConnectionQuality('excellent')
                                break
                            case 'checking':
                                setConnectionQuality('good')
                                break
                            case 'disconnected':
                                setConnectionQuality('poor')
                                break
                            case 'failed':
                                setConnectionQuality('poor')
                                break
                        }
                    }
                }
            }
            if (newState === SessionState.Terminated) {
                handleCallEnd(session)
            }
        })
    }

    const handleCallEnd = async (session: Session) => {
        const duration = callSeconds
        const callRecord: CallRecord = {
            id: Date.now().toString(),
            number: session.remoteIdentity?.uri?.toString() || 'Unknown',
            direction: incomingConnection ? 'inbound' : 'outbound',
            duration,
            status: 'completed',
            timestamp: currentCallStartTime.current || new Date(),
            notes: callNotes,
            transcription: liveTranscription,
        }

        try {
            await fetch('/api/calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(callRecord)
            })
            log('✅ Call saved to database', 'info')
        } catch (error: any) {
            log(`❌ Failed to save call: ${error.message}`, 'error')
        }

        setCallHistory(prev => [callRecord, ...prev])
        setIsCalling(false)
        setCurrentConnection(null)
        setIsOnHold(false)
        setIsMuted(false)
        setIsRecording(false)
        setCallNotes('')
        currentSession.current = null

        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }

        log(`📴 Call ended - Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, 'info')
    }

    // Actions
    const startCall = async (phoneNumber: string) => {
        if (!ua || !isReady) {
            log("❌ Dialer not ready", "error");
            return;
        }

        try {
            const cleanNumber = phoneNumber.startsWith("+")
                ? phoneNumber
                : `+${phoneNumber.replace(/\D/g, "")}`;

            log(`📞 Initiating call to ${cleanNumber}`, "info");

            const targetURI = UserAgent.makeURI(
                `sip:${cleanNumber}@${process.env.NEXT_PUBLIC_SIP_DOMAIN}`
            )
            if (!targetURI) throw new Error("Invalid target URI");

            const inviter = new Inviter(ua, targetURI, {
                sessionDescriptionHandlerOptions: {
                    constraints: { audio: true, video: false }
                }
            });

            inviter.stateChange.addListener((state) => {
                if (state === SessionState.Established) {
                    log("📞 Call connected", "info");
                    setIsCalling(true);
                }
                if (state === SessionState.Terminated) {
                    handleCallEnd(inviter);
                }
            });

            await inviter.invite();
            currentSession.current = inviter;

            setCurrentConnection({
                accept: () => { }, // Outbound calls are already accepted
                reject: () => inviter.cancel(),
                disconnect: () => inviter.dispose(),
                parameters: { To: cleanNumber },
                mute: (muted: boolean) => {
                    const pc = (inviter.sessionDescriptionHandler as any)?.peerConnection;
                    if (pc) {
                        pc.getSenders().forEach((sender: RTCRtpSender) => {
                            if (sender.track && sender.track.kind === "audio") {
                                sender.track.enabled = !muted;
                            }
                        });
                    }
                },
                sendDigits: (digits: string) => {
                    const sdh = (inviter.sessionDescriptionHandler as any);
                    if (sdh && typeof sdh.sendDtmf === 'function') {
                        sdh.sendDtmf(digits);
                    } else {
                        log('DTMF not supported on this session', 'warning');
                    }
                }
            });
        } catch (error: any) {
            log(`❌ Error starting call: ${error.message}`, "error");
        }
    };


    const hangUp = () => {
        if (currentSession.current) {
            currentSession.current.dispose()
            currentSession.current = null
        }

        if (incomingConnection) {
            incomingConnection.reject()
            setIncomingConnection(null)
            setIsRinging(false)
            stopRingtone()
        }

        setIsCalling(false)
        setCurrentConnection(null)
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
        if (currentSession.current) {
            const pc = (currentSession.current.sessionDescriptionHandler as any)?.peerConnection;
            if (!pc) return;
            if (isOnHold) {
                pc.getSenders().forEach((sender: RTCRtpSender) => sender.track && (sender.track.enabled = true));
                setIsOnHold(false);
                log("✅ Call resumed", "info");
            } else {
                pc.getSenders().forEach((sender: { track: { enabled: boolean; }; }) => sender.track && (sender.track.enabled = false));
                setIsOnHold(true);
                log("🎵 Call placed on hold (muted)", "info");
            }
        }
    };


    const toggleRecording = () => {
        if (!currentSession.current) return

        try {
            const pc = (currentSession.current.sessionDescriptionHandler as any)?.peerConnection
            if (!pc) return

            if (isRecording && mediaRecorder.current) {
                mediaRecorder.current.stop()
                setIsRecording(false)
                log('Recording stopped', 'info')
            } else {
                const stream = new MediaStream()
                pc.getReceivers().forEach((receiver: { track: MediaStreamTrack }) => {
                    if (receiver.track) {
                        stream.addTrack(receiver.track)
                    }
                })

                mediaRecorder.current = new MediaRecorder(stream)
                mediaRecorder.current.start()
                setIsRecording(true)
                log('Recording started', 'info')
            }
        } catch (error: any) {
            log(`❌ Recording toggle failed: ${error.message}`, 'error')
        }
    }

    const toggleTranscription = () => {
        try {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                log('❌ Speech recognition not supported', 'error')
                return
            }

            if (isTranscribing && recognitionRef.current) {
                recognitionRef.current.stop()
                setIsTranscribing(false)
                log('Live transcription stopped', 'info')
            } else {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                recognitionRef.current = new SpeechRecognition()

                recognitionRef.current.continuous = true
                recognitionRef.current.interimResults = true
                recognitionRef.current.lang = 'en-US'

                recognitionRef.current.onresult = (event: any) => {
                    let transcript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript
                    }
                    setLiveTranscription(transcript)
                }

                recognitionRef.current.start()
                setIsTranscribing(true)
                log('Live transcription started', 'info')
            }
        } catch (error: any) {
            log(`❌ Transcription toggle failed: ${error.message}`, 'error')
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
        // Implement transfer logic based on your SIP server capabilities
    }

    const startConference = (numbers: string[]) => {
        setConferenceParticipants(numbers)
        setIsInConference(true)
        log(`Conference started with ${numbers.length} participants`, 'info')
        // Implement conference logic based on your SIP server capabilities
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
                ua,
                isReady,
                connectionQuality,
                userPhone,

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