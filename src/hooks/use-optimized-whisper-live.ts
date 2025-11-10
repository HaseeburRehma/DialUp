// src/hooks/use-optimized-whisper-live.ts
// Key fixes: Disable VAD, relax silence detection, increase buffer size

import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Segment } from '@/types/transcription'

export interface Recording {
  id: string
  url: string
  blob?: Blob
}

export interface OptimizedWhisperLiveConfig {
  wsPath?: string
  serverUrl: string
  port: number
  language: string
  translate: boolean
  model: string
  vad: boolean
  saveRecording: boolean
  outputFilename: string
  maxClients: number
  maxConnectionTime: number
  audioSources?: {
    microphone: boolean
    systemAudio: boolean
  }
  optimization?: {
    chunkSize?: number
    bufferSize?: number
    enableSmartBuffering?: boolean
    enableNoiseReduction?: boolean
    same_output_threshold?: number
    no_speech_thresh?: number
  }
}

interface OptimizedWhisperLiveState {
  isConnected: boolean
  isTranscribing: boolean
  transcript: string
  error: string | null
  segments: Segment[]
  connectionQuality: 'excellent' | 'good' | 'poor'
  latency: number
}

function encodeWAVOptimized(
  samples: Float32Array,
  sampleRate: number
): Uint8Array<ArrayBuffer> {
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample

  const bytes = new Uint8Array(new ArrayBuffer(44 + dataSize)) as Uint8Array<ArrayBuffer>
  const view = new DataView(bytes.buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) bytes[offset + i] = str.charCodeAt(i)
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const samples16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    samples16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  bytes.set(new Uint8Array(samples16.buffer), 44)

  return bytes
}

export function useOptimizedWhisperLive(
  config: OptimizedWhisperLiveConfig,
  initialRecordings: Recording[] = []
) {
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings)
  const [state, setState] = useState<OptimizedWhisperLiveState>({
    isConnected: false,
    isTranscribing: false,
    transcript: '',
    error: null,
    segments: [],
    connectionQuality: 'excellent',
    latency: 0,
  })

  const [audioData, setAudioData] = useState<Uint8Array | null>(null)
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)

 // const recordingBuffers = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(16000)
  const lastSegmentIndexRef = useRef(0)
  const audioDataRef = useRef<Uint8Array | null>(null)
  const performanceRef = useRef({
    lastMessageTime: 0,
    messageCount: 0,
    averageLatency: 0,
  })

  const transcriptHistoryRef = useRef<Set<string>>(new Set())
  const lastProcessedMessageRef = useRef<string>('')
  const segmentHistoryRef = useRef<Map<string, number>>(new Map())

  const micRef = useRef<MediaStream | null>(null)
  const systemRef = useRef<MediaStream | null>(null)
  const wsMicRef = useRef<WebSocket | null>(null)
  const wsSysRef = useRef<WebSocket | null>(null)
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const sysProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const connectionAttempts = useRef(0)
  const micBuffers = useRef<Float32Array[]>([])
  const sysBuffers = useRef<Float32Array[]>([])

  const uidRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  )

  const { toast } = useToast()

  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  const isDuplicate = useCallback((text: string): boolean => {
    const normalized = normalizeText(text)
    if (normalized.length < 3) return true

    if (transcriptHistoryRef.current.has(normalized)) {
      return true
    }

    for (const historical of transcriptHistoryRef.current) {
      if (historical.includes(normalized) || normalized.includes(historical)) {
        return true
      }
    }

    return false
  }, [normalizeText])

  const addToHistory = useCallback((text: string): void => {
    const normalized = normalizeText(text)
    if (normalized.length >= 3) {
      transcriptHistoryRef.current.add(normalized)

      if (transcriptHistoryRef.current.size > 50) {
        const entries = Array.from(transcriptHistoryRef.current)
        transcriptHistoryRef.current.clear()
        entries.slice(-25).forEach(entry => transcriptHistoryRef.current.add(entry))
      }
    }
  }, [normalizeText])

  // ✅ FIX 1: Disable VAD in WebSocket config + Fixed URL construction
  function openRoleSocket(role: 'agent' | 'caller'): WebSocket {
    // Construct WebSocket URL properly
    let wsUrl: string

    if (process.env.NEXT_PUBLIC_WHISPER_WS) {
      // Use explicitly set Whisper WebSocket URL
      wsUrl = process.env.NEXT_PUBLIC_WHISPER_WS
    } else if (config.wsPath) {
      // Use config path (e.g., '/whisper')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = config.serverUrl && config.port
        ? `${config.serverUrl}:${config.port}`
        : window.location.host
      wsUrl = `${protocol}//${host}${config.wsPath}`
    } else {
      // Fallback: construct from config
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${protocol}//${config.serverUrl}:${config.port}`
    }

    console.log(`[OptimizedWhisperLive] Connecting ${role} to:`, wsUrl)

    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      ws.send(JSON.stringify({
        task: 'transcribe',
        uid: `${uidRef.current}-${role}`,
        language: config.language,
        model: config.model,
        use_vad: false, // ✅ DISABLED - VAD was removing all audio
        stream: true,
        save_recording: config.saveRecording,
        output_filename: `${config.outputFilename || 'recording'}-${role}.wav`,
        sample_rate: sampleRateRef.current,
        chunk_size: config.optimization?.chunkSize || 4096 // ✅ Increased from 2048
      }))
    }

    ws.onmessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return
      try {
        const msg = JSON.parse(e.data)

        if (Array.isArray(msg.segments)) {
          const now = Date.now()
          const newSegments: Segment[] = []
          for (const wsSeg of msg.segments) {
            const text = (wsSeg.text || '').trim()
            if (!text) continue
            const norm = normalizeText(text)
            if (segmentHistoryRef.current.has(norm)) continue

            newSegments.push({
              id: `${role}-${now}-${Math.random().toString(36).slice(2, 6)}`,
              speaker: role,
              text,
              content: text,
              isFinal: true,
              timestamp: now,
              confidence: wsSeg.confidence ?? 0.8
            })
            segmentHistoryRef.current.set(norm, now)
          }
          if (newSegments.length) {
            setState(s => ({
              ...s,
              segments: [...s.segments, ...newSegments],
              isTranscribing: true
            }))
          }
        }

        if ((msg.type === 'final' || msg.type === 'transcript') && msg.text) {
          const t = msg.text.trim()
          if (t && !isDuplicate(t)) {
            addToHistory(t)
            setState(s => ({
              ...s,
              transcript: s.transcript
                ? `${s.transcript}\n[${role.toUpperCase()}] ${t}`
                : `[${role.toUpperCase()}] ${t}`,
            }))
          }
        }
      } catch { }
    }

    ws.onclose = (event: CloseEvent) => {
      console.warn(`[OptimizedWhisperLive] 🔴 ${role} socket closed:`, event.code, event.reason)

      // Update state on disconnect
      setState(s => ({
        ...s,
        isConnected: false,
        error: event.code === 1006
          ? `Connection failed: Cannot reach Whisper server at ${wsUrl}`
          : `Connection closed: ${event.reason || 'Unknown reason'}`
      }))
    }

    ws.onerror = (event: Event) => {
      console.error(`[OptimizedWhisperLive] ❌ WebSocket error for ${role}:`, event)

      // Show user-friendly error
      toast({
        title: 'Connection Error',
        description: `Failed to connect to Whisper server. Please check if the server is running at ${wsUrl}`,
        variant: 'destructive'
      })
    }

    return ws
  }

  const connect = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Connecting with enhanced performance...')

    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()
    lastProcessedMessageRef.current = ''

    // Check microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: config.optimization?.enableNoiseReduction ?? true,
          autoGainControl: true,
        }
      })
    } catch (err: any) {
      setState(s => ({ ...s, error: `Microphone permission denied: ${err.message}` }))
      toast({
        title: 'Microphone Error',
        description: err.message,
        variant: 'destructive'
      })
      return
    }

    // Check if Whisper server is reachable
    const wsUrl = process.env.NEXT_PUBLIC_WHISPER_WS ||
      (config.wsPath
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${config.serverUrl || window.location.hostname}:${config.port}${config.wsPath}`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${config.serverUrl}:${config.port}`)

    console.log('[OptimizedWhisperLive] Whisper server URL:', wsUrl)

    const ctx = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    })
    ctxRef.current = ctx
    sampleRateRef.current = ctx.sampleRate
 //   recordingBuffers.current = []

    setState(s => ({ ...s, error: null }))

    // Open WebSocket connections
    try {
      wsMicRef.current = openRoleSocket('agent')
      wsSysRef.current = openRoleSocket('caller')
      setState(s => ({ ...s, isConnected: true }))
      await startTranscription()
    } catch (err: any) {
      setState(s => ({
        ...s,
        error: `Failed to connect to Whisper server: ${err.message}`,
        isConnected: false
      }))
      toast({
        title: 'Connection Failed',
        description: `Cannot connect to Whisper server. Make sure it's running at ${wsUrl}`,
        variant: 'destructive'
      })
    }

  }, [config, toast, isDuplicate, addToHistory, normalizeText])

  const startTranscription = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      micRef.current = micStream

      let systemStream: MediaStream | null = null
      if (config.audioSources?.systemAudio) {
        try {
          systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          systemRef.current = systemStream
        } catch {
          console.warn('[OptimizedWhisperLive] System audio denied.')
        }
      }

      // Inside startTranscription()
      const ctx = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' })
      ctxRef.current = ctx
      sampleRateRef.current = ctx.sampleRate

      // 🔊 Audio chain: mic → highpass → compressor → processor
      const micSrc = ctx.createMediaStreamSource(micStream)

      // High-pass filter @150 Hz (cuts desk/fan hum)
      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 150

      // Dynamics compressor smooths volume
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -24
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25

      // Attach chain
      micSrc.connect(highpass)
      highpass.connect(compressor)

      const micProc = ctx.createScriptProcessor(4096, 1, 1)
      compressor.connect(micProc)
      micProc.connect(ctx.destination)

      // --- Real-time Noise Gate (ignore quiet < -45 dB) ---
      micProc.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0)
        const clone = new Float32Array(input.length)
        clone.set(input)

        // Compute RMS
        let sumSq = 0
        for (let i = 0; i < clone.length; i++) sumSq += clone[i] * clone[i]
        const rms = Math.sqrt(sumSq / clone.length)
        const db = 20 * Math.log10(rms + 1e-8)

        // Skip near-silence (<-45 dB)
        if (db < -45) return

        if (config.saveRecording) micBuffers.current.push(clone)

        if (wsMicRef.current?.readyState === WebSocket.OPEN)
          wsMicRef.current.send(clone.buffer)
      }
      micProcessorRef.current = micProc

      // SYSTEM - Same fixes applied
      if (systemStream) {
        const sysSrc = ctx.createMediaStreamSource(systemStream)
        const sysProc = ctx.createScriptProcessor(4096, 1, 1) // ✅ Was 2048
        sysSrc.connect(sysProc)
        sysProc.connect(ctx.destination)

        sysProc.onaudioprocess = (e: AudioProcessingEvent) => {
          const input = e.inputBuffer.getChannelData(0)
          const clone = new Float32Array(input.length)
          clone.set(input)

          const rms = Math.sqrt(clone.reduce((s, v) => s + v * v, 0) / clone.length)
          if (rms < 0.0001) return // ✅ More permissive

          if (config.saveRecording) sysBuffers.current.push(clone)

          const ui8 = new Uint8Array(clone.length)
          for (let i = 0; i < clone.length; i++)
            ui8[i] = Math.min(255, Math.max(0, Math.floor((clone[i] + 1) * 127.5)))
          audioDataRef.current = ui8
          setAudioData(ui8)
          setDataUpdateTrigger(t => t + 1)

          if (wsSysRef.current?.readyState === WebSocket.OPEN)
            wsSysRef.current.send(clone.buffer)
        }

        sysProcessorRef.current = sysProc
      }

      setState(s => ({ ...s, isTranscribing: true, error: null }))
    } catch (err: any) {
      setState(s => ({ ...s, error: `Failed to start transcription: ${err.message}` }))
      toast({ title: 'Transcription Error', description: err.message, variant: 'destructive' })
    }
  }, [config, toast])

  const stopTranscription = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Stopping transcription...')



    micProcessorRef.current?.disconnect()
    sysProcessorRef.current?.disconnect()
    micProcessorRef.current = null
    sysProcessorRef.current = null

    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (micRef.current) {
      micRef.current.getTracks().forEach(t => t.stop())
      micRef.current = null
    }
    if (systemRef.current) {
      systemRef.current.getTracks().forEach(t => t.stop())
      systemRef.current = null

    }

    if (config.saveRecording && (micBuffers.current.length > 0 || sysBuffers.current.length > 0)) {
      console.log('[OptimizedWhisperLive] Processing recording...')

      try {
        const sampleRate = sampleRateRef.current

        // Combine all mic buffers
        const micLength = micBuffers.current.reduce((sum, buf) => sum + buf.length, 0)
        const micData = new Float32Array(micLength)
        let offset = 0
        for (const buf of micBuffers.current) {
          micData.set(buf, offset)
          offset += buf.length
        }

        // Combine all system buffers (if available)
        let sysData: Float32Array | null = null
        if (sysBuffers.current.length > 0) {
          const sysLength = sysBuffers.current.reduce((sum, buf) => sum + buf.length, 0)
          sysData = new Float32Array(sysLength)
          offset = 0
          for (const buf of sysBuffers.current) {
            sysData.set(buf, offset)
            offset += buf.length
          }
        }

        // Normalize mic
        let maxAmp = 0
        for (let i = 0; i < micData.length; i++) {
          const val = Math.abs(micData[i])
          if (val > maxAmp) maxAmp = val
        }
        if (maxAmp === 0) maxAmp = 1
        for (let i = 0; i < micData.length; i++) micData[i] /= maxAmp

        // Normalize and mix system audio (if available)
        let interleaved: Float32Array
        if (sysData) {
          let maxSys = 0
          for (let i = 0; i < sysData.length; i++) {
            const val = Math.abs(sysData[i])
            if (val > maxSys) maxSys = val
          }
          if (maxSys === 0) maxSys = 1
          for (let i = 0; i < sysData.length; i++) sysData[i] /= maxSys

          // Mix mic + system equally
          const length = Math.min(micData.length, sysData.length)
          interleaved = new Float32Array(length)
          for (let i = 0; i < length; i++) {
            interleaved[i] = (micData[i] + sysData[i]) / 2
          }
        } else {
          interleaved = micData
        }

        const wavBytes = encodeWAVOptimized(interleaved, sampleRate)
        const blob = new Blob([wavBytes], { type: 'audio/wav' })
        const formData = new FormData()
        formData.append('file', blob, config.outputFilename || `recording-${Date.now()}.wav`)

        const uploadUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/upload`
          : '/api/upload'

        const response = await fetch(uploadUrl, { method: 'POST', body: formData })
        if (!response.ok) throw new Error(await response.text())

        const { url } = await response.json()
        setRecordings(rs => [...rs, { id: Date.now().toString(), url, blob }])
        console.log('[OptimizedWhisperLive] ✅ Recording uploaded successfully:', url)
      } catch (err: any) {
        console.error('[OptimizedWhisperLive] Upload error:', err)
        toast({
          title: 'Upload Error',
          description: `Failed to save recording: ${err.message}`,
          variant: 'destructive',
        })
      }

      micBuffers.current = []
      sysBuffers.current = []



      await new Promise(r => setTimeout(r, 400))
     // recordingBuffers.current = []
    }

    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      await ctxRef.current.close()
      ctxRef.current = null
    }

    setState(s => ({ ...s, isTranscribing: false }))
  }, [config, toast])

  const disconnect = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Disconnecting gracefully…')

    if (wsMicRef.current?.readyState === WebSocket.OPEN) {
      wsMicRef.current.send('END_OF_AUDIO')
      await new Promise(r => setTimeout(r, 800))
      wsMicRef.current.close(1000, 'Normal Closure')
    }
    wsMicRef.current = null

    if (wsSysRef.current?.readyState === WebSocket.OPEN) {
      wsSysRef.current.send('END_OF_AUDIO')
      await new Promise(r => setTimeout(r, 800))
      wsSysRef.current.close(1000, 'Normal Closure')
    }
    wsSysRef.current = null

    await new Promise(r => setTimeout(r, 200))
    await stopTranscription()

    setState(s => ({
      ...s,
      isConnected: false,
      isTranscribing: false,
      connectionQuality: 'excellent',
      latency: 0,
    }))
  }, [stopTranscription])

  const clearTranscript = useCallback(() => {
    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()
    setState(s => ({ ...s, transcript: '', segments: [] }))
  }, [])

  const resetRecordings = useCallback(() => {
    setRecordings([])
  }, [])

  const deleteRecording = useCallback((recording: Recording) => {
    setRecordings(rs => rs.filter(r => r.id !== recording.id))
  }, [])

  return {
    state,
    connect,
    startTranscription,
    stopTranscription,
    disconnect,
    clearTranscript,
    audioData,
    dataUpdateTrigger,
    recordings,
    deleteRecording,
    resetRecordings,
  }
}