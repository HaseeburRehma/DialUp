// src/hooks/use-optimized-whisper-live.ts


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

// Optimized WAV encoding with better performance
function encodeWAVOptimized(
  samples: Float32Array,
  sampleRate: number
): Uint8Array<ArrayBuffer> {
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample

  // Allocate a REAL ArrayBuffer and a byte view over it
  const bytes = new Uint8Array(new ArrayBuffer(44 + dataSize)) as Uint8Array<ArrayBuffer>
  const view = new DataView(bytes.buffer)

  // Header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) bytes[offset + i] = str.charCodeAt(i)
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)               // PCM header size
  view.setUint16(20, 1, true)                // audio format = PCM
  view.setUint16(22, 1, true)                // channels = 1
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // PCM data (convert float -> int16)
  const samples16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    samples16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  // Copy Int16 bytes into payload starting at offset 44
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

  // Enhanced refs for performance tracking
  const wsRef = useRef<WebSocket | null>(null)
  const recordingBuffers = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(16000)
  const lastSegmentIndexRef = useRef(0)
  const audioDataRef = useRef<Uint8Array | null>(null)
  const performanceRef = useRef({
    lastMessageTime: 0,
    messageCount: 0,
    averageLatency: 0,
  })

  // Enhanced deduplication tracking
  const transcriptHistoryRef = useRef<Set<string>>(new Set())
  const lastProcessedMessageRef = useRef<string>('')
  const segmentHistoryRef = useRef<Map<string, number>>(new Map())

  // Audio processing refs
  const micRef = useRef<MediaStream | null>(null)
  const systemRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const connectionAttempts = useRef(0)

  const uidRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  )

  const { toast } = useToast()

  // Enhanced deduplication utility functions
  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])



  const isDuplicate = useCallback((text: string): boolean => {
    const normalized = normalizeText(text)
    if (normalized.length < 1) return true // Ignore very short texts

    if (transcriptHistoryRef.current.has(normalized)) {
      return true
    }

    // Check for substring matches in recent history
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

      // Keep history manageable (last 50 items)
      if (transcriptHistoryRef.current.size > 50) {
        const entries = Array.from(transcriptHistoryRef.current)
        transcriptHistoryRef.current.clear()
        entries.slice(-25).forEach(entry => transcriptHistoryRef.current.add(entry))
      }
    }
  }, [normalizeText])

  // Enhanced connection with retry logic
  const connect = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Connecting with enhanced performance...')

    // Clear history on new connection
    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()
    lastProcessedMessageRef.current = ''

    // Request permissions first
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
      return
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Create optimized AudioContext
    const ctx = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    })
    ctxRef.current = ctx
    sampleRateRef.current = ctx.sampleRate
    recordingBuffers.current = []

    setState(s => ({ ...s, error: null }))

    // ✅ FIXED: Always use the Express proxy endpoint
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const base =
      process.env.NEXT_PUBLIC_WS_BASE ||
      `${protocol}://${window.location.host}`

    const wsUrl =
      process.env.NEXT_PUBLIC_WHISPER_WS ||
      `${base}/whisper`

    console.log('[OptimizedWhisperLive] Connecting to WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.binaryType = 'arraybuffer'
    wsRef.current = ws
    lastSegmentIndexRef.current = 0
    performanceRef.current = {
      lastMessageTime: Date.now(),
      messageCount: 0,
      averageLatency: 0,
    }

    ws.onopen = async () => {
      console.log('[OptimizedWhisperLive] 🟢 WebSocket connected with optimization')
      connectionAttempts.current = 0

      // Send optimized configuration
      ws.send(JSON.stringify({
        task: 'transcribe',
        uid: uidRef.current,
        language: config.language,
        model: config.model,
        use_vad: config.vad,
        stream: true,
        diarize: true,                // 👈 enable speaker diarization
        return_speaker_labels: true,
        save_recording: config.saveRecording,
        output_filename: config.outputFilename,
        max_clients: config.maxClients,
        max_connection_time: Math.max(config.maxConnectionTime, 3600),
        sample_rate: sampleRateRef.current,
        chunk_size: config.optimization?.chunkSize || 2048,
        buffer_size: config.optimization?.bufferSize || 4096,
        enable_smart_buffering: config.optimization?.enableSmartBuffering ?? true,
        same_output_threshold: config.optimization?.same_output_threshold ?? 0.5,
        no_speech_thresh: config.optimization?.no_speech_thresh ?? 0.45
      }));

      setState(s => ({ ...s, isConnected: true, connectionQuality: 'excellent' }))
      await startTranscription()
    }

    // ENHANCED: Completely rewritten message handling with better deduplication
    ws.onmessage = (e) => {
      const now = Date.now()
      const perf = performanceRef.current

      // Update performance metrics
      perf.messageCount++
      const latency = now - perf.lastMessageTime
      perf.averageLatency = (perf.averageLatency * (perf.messageCount - 1) + latency) / perf.messageCount
      perf.lastMessageTime = now

      // Update connection quality based on latency
      let quality: 'excellent' | 'good' | 'poor' = 'excellent'
      if (perf.averageLatency > 500) quality = 'poor'
      else if (perf.averageLatency > 200) quality = 'good'

      setState(s => ({
        ...s,
        latency: Math.round(perf.averageLatency),
        connectionQuality: quality
      }))

      if (typeof e.data !== 'string') return

      try {
        const msg = JSON.parse(e.data)

        // Skip duplicate messages
        const messageKey = JSON.stringify(msg)
        if (messageKey === lastProcessedMessageRef.current) {
          return
        }
        lastProcessedMessageRef.current = messageKey

        if (msg.message === 'SERVER_READY') return

        if (msg.type === 'error') {
          setState(s => ({ ...s, error: msg.message }))
          return
        }

        // Enhanced segment processing with better deduplication
        if (Array.isArray(msg.segments) && msg.segments.length > 0) {
          // Calculate RMS for volume detection
          let rms = 0
          if (audioDataRef.current) {
            const data = audioDataRef.current
            let sum = 0
            for (const x of data) sum += (x - 128) ** 2
            rms = Math.sqrt(sum / data.length) / 128
          }

          const newSegments: Segment[] = []

          for (const wsSeg of msg.segments) {
            if (!wsSeg.text || !wsSeg.text.trim()) continue

            const content = wsSeg.text.trim()
            const segmentKey = normalizeText(content)

            // Skip if we've seen this exact segment content recently
            if (segmentHistoryRef.current.has(segmentKey)) {
              continue
            }

            // Check for duplicate content
            if (!isDuplicate(content)) {
              const segment: Segment = {
                speaker: wsSeg.speaker === 0 ? 'mic' : 'speaker',
                text: content,
                content,
                volume: rms,
                confidence: wsSeg.confidence || 0.8,
                id: '',
                timestamp: 0,
                isFinal: true,
              }

              newSegments.push(segment)
              addToHistory(content)

              // Track this segment to prevent immediate duplicates
              segmentHistoryRef.current.set(segmentKey, now)
            }
          }

          // Clean old segment history (remove entries older than 30 seconds)
          for (const [key, timestamp] of segmentHistoryRef.current.entries()) {
            if (now - timestamp > 30000) {
              segmentHistoryRef.current.delete(key)
            }
          }

          if (newSegments.length > 0) {
            setState(s => ({
              ...s,
              segments: [...s.segments, ...newSegments],
              isTranscribing: true,
            }))
          }
          return
        }

        // Handle partial transcription (keep separate, don't add to main transcript)
        if (msg.type === 'partial') {
          if (msg.text && msg.text.trim() && !isDuplicate(msg.text)) {
            setState(s => ({
              ...s,
              isTranscribing: true,
              currentPartial: msg.text.trim()
            }))
          }
          return
        }

        // Handle final transcription
        if (msg.type === 'final' || msg.type === 'transcript') {
          if (msg.text && msg.text.trim() && !isDuplicate(msg.text)) {
            const cleanText = msg.text.trim()
            addToHistory(cleanText)

            setState(s => ({
              ...s,
              isTranscribing: false,
              transcript: s.transcript ? `${s.transcript} ${cleanText}` : cleanText,
              currentPartial: ''
            }))
          }
          return
        }

        // Enhanced fallback message handling
        if (msg.message && msg.message !== 'SERVER_READY' && !isDuplicate(msg.message)) {
          const cleanMessage = msg.message.trim()
          addToHistory(cleanMessage)

          setState(s => ({
            ...s,
            isTranscribing: true,
            transcript: s.transcript ? `${s.transcript} ${cleanMessage}` : cleanMessage
          }))
        }

      } catch (err) {
        console.warn('[OptimizedWhisperLive] Failed to parse message:', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[OptimizedWhisperLive] 🔴 WebSocket closed:', event.code, event.reason)
      setState(s => ({ ...s, isConnected: false, isTranscribing: false }))

      // Auto-reconnect logic with exponential backoff
      if (event.code !== 1000 && connectionAttempts.current < 5) {
        const delay = Math.min(30000, 1000 * 2 ** connectionAttempts.current);
        console.warn(`[OptimizedWhisperLive] Reconnecting in ${delay / 1000}s...`);
        connectionAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else if (connectionAttempts.current >= 5) {
        setState(s => ({ ...s, error: 'Connection failed after multiple attempts. Please refresh the page.' }))
      }
    }

    ws.onerror = (err) => {
      console.warn('[OptimizedWhisperLive] WebSocket error:', err)
    }
  }, [config, toast, isDuplicate, addToHistory, normalizeText])

  // Utility to send speaker-labeled audio frames
  function sendWithSpeaker(float32: Float32Array, speaker: number) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    // Allocate [1 byte speaker ID + PCM data]
    const pcmBuffer = float32.buffer
    const out = new Uint8Array(pcmBuffer.byteLength + 1)
    out[0] = speaker // 0 = caller, 1 = receiver
    out.set(new Uint8Array(pcmBuffer), 1)

    wsRef.current.send(out)
  }

  const startTranscription = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState(s => ({ ...s, error: 'Not connected to server' }))
      return
    }

    try {
      // --- Microphone ---
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: config.optimization?.enableNoiseReduction ?? true,
          autoGainControl: true,
        },
      })
      micRef.current = micStream
      const micSrc = ctxRef.current!.createMediaStreamSource(micStream)
      const micProc = ctxRef.current!.createScriptProcessor(config.optimization?.chunkSize || 2048, 1, 1)
      micSrc.connect(micProc)
      micProc.onaudioprocess = e => {
        const float32 = e.inputBuffer.getChannelData(0)
        sendWithSpeaker(float32, 0) // caller
      }

      // --- System Audio (if enabled) ---
      if (config.audioSources?.systemAudio) {
        try {
          const sysStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: { sampleRate: 16000, channelCount: 1 },
          })
          systemRef.current = sysStream
          const sysSrc = ctxRef.current!.createMediaStreamSource(sysStream)
          const sysProc = ctxRef.current!.createScriptProcessor(config.optimization?.chunkSize || 2048, 1, 1)
          sysSrc.connect(sysProc)
          sysProc.onaudioprocess = e => {
            const float32 = e.inputBuffer.getChannelData(0)
            sendWithSpeaker(float32, 1) // receiver
          }
        } catch {
          console.warn('[OptimizedWhisperLive] System audio denied, using mic only')
        }
      }

      setState(s => ({ ...s, isTranscribing: true, error: null }))
    } catch (err: any) {
      setState(s => ({ ...s, error: `Failed to start transcription: ${err.message}` }))
      toast({
        title: 'Transcription Error',
        description: err.message,
        variant: 'destructive',
      })
    }
  }, [config, toast])

  // Optimized transcription stop
  const stopTranscription = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Stopping transcription...')

    // Send end signal
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(new TextEncoder().encode('END_OF_AUDIO'))
    }

    // Clean up audio processing
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    // Stop tracks
    if (micRef.current) {
      micRef.current.getTracks().forEach(t => t.stop())
      micRef.current = null
    }
    if (systemRef.current) {
      systemRef.current.getTracks().forEach(t => t.stop())
      systemRef.current = null
    }

    // Handle recording upload
    if (config.saveRecording && recordingBuffers.current.length > 0) {
      console.log('[OptimizedWhisperLive] Processing recording...', recordingBuffers.current.length, 'buffers')

      try {
        const sampleRate = sampleRateRef.current
        const totalLength = recordingBuffers.current.reduce((sum, buf) => sum + buf.length, 0)
        const interleaved = new Float32Array(totalLength)

        let offset = 0
        for (const buf of recordingBuffers.current) {
          interleaved.set(buf, offset)
          offset += buf.length
        }

        const wavBytes = encodeWAVOptimized(interleaved, sampleRate)
        const blob = new Blob([wavBytes], { type: 'audio/wav' })
        const formData = new FormData()
        formData.append('file', blob, config.outputFilename || `recording-${Date.now()}.wav`)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const { url } = await response.json()
        const recording: Recording = {
          id: Date.now().toString(),
          url,
          blob
        }

        setRecordings(rs => [...rs, recording])
        console.log('[OptimizedWhisperLive] ✅ Recording uploaded successfully:', url)
      } catch (err: any) {
        console.error('[OptimizedWhisperLive] Upload error:', err)
        toast({
          title: 'Upload Error',
          description: `Failed to save recording: ${err.message}`,
          variant: 'destructive',
        })
      }

      recordingBuffers.current = []
    }

    // Close AudioContext
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      await ctxRef.current.close()
      ctxRef.current = null
    }

    setState(s => ({ ...s, isTranscribing: false }))
  }, [config, toast])

  // Enhanced disconnect with cleanup
  const disconnect = useCallback(() => {
    console.log('[OptimizedWhisperLive] Disconnecting...')

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect')
      wsRef.current = null
    }

    // Stop transcription
    stopTranscription()

    // Clear history
    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()

    // Reset state
    setState(s => ({
      ...s,
      isConnected: false,
      isTranscribing: false,
      transcript: '',
      error: null,
      segments: [],
      connectionQuality: 'excellent',
      latency: 0,
    }))

    connectionAttempts.current = 0
  }, [stopTranscription])

  // Utility functions
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
