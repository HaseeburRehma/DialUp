import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Segment } from '@/types/transcription'

export interface Recording { 
  id: string
  url: string
  blob?: Blob
}

export interface OptimizedWhisperLiveConfig {
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
function encodeWAVOptimized(samples: Float32Array, sampleRate: number): DataView {
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // Write WAV header efficiently
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
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

  // Optimized PCM writing
  let offset = 44
  const samples16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    samples16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  
  new Uint8Array(buffer, offset).set(new Uint8Array(samples16.buffer))
  return view
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

  // Enhanced connection with retry logic
  const connect = useCallback(async () => {
    console.log('[OptimizedWhisperLive] Connecting with enhanced performance...')
    
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

    // Enhanced WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = config.serverUrl === 'localhost' || config.serverUrl === '::1' 
      ? '127.0.0.1' 
      : config.serverUrl

    const ws = new WebSocket(`${protocol}://${host}:${config.port}`)
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
        save_recording: config.saveRecording,
        output_filename: config.outputFilename,
        max_clients: config.maxClients,
        max_connection_time: Math.max(config.maxConnectionTime, 3600),
        sample_rate: sampleRateRef.current,
        chunk_size: config.optimization?.chunkSize || 2048, // Smaller chunks for faster processing
        buffer_size: config.optimization?.bufferSize || 4096,
        enable_smart_buffering: config.optimization?.enableSmartBuffering ?? true,
      }))

      setState(s => ({ ...s, isConnected: true, connectionQuality: 'excellent' }))
      await startTranscription()
    }

    // Optimized message handling
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

        if (msg.message === 'SERVER_READY') return

        if (msg.type === 'error') {
          setState(s => ({ ...s, error: msg.message }))
          return
        }

        // Handle partial transcription
        if (msg.type === 'partial') {
          setState(s => ({
            ...s,
            isTranscribing: true,
            transcript: s.transcript + msg.text
          }))
          return
        }

        // Handle final transcription
        if (msg.type === 'final' || msg.type === 'transcript') {
          setState(s => ({
            ...s,
            isTranscribing: false,
            transcript: s.transcript + msg.text + '\n'
          }))
          return
        }

        // Enhanced segment processing
        if (Array.isArray(msg.segments)) {
          // Calculate RMS for volume detection
          let rms = 0
          if (audioDataRef.current) {
            const data = audioDataRef.current
            let sum = 0
            for (const x of data) sum += (x - 128) ** 2
            rms = Math.sqrt(sum / data.length) / 128
          }

          const newSegments: Segment[] = msg.segments
            .filter((wsSeg: any) => wsSeg.text && wsSeg.text.trim().length > 0)
            .map((wsSeg: any) => ({
              speaker: wsSeg.speaker === 0 ? 'mic' : 'speaker',
              content: wsSeg.text.trim(),
              volume: rms,
              confidence: wsSeg.confidence || 0.8,
            }))

          if (newSegments.length > 0) {
            setState(s => {
              // Smart deduplication
              const existingContent = new Set(s.segments.map(seg => seg.content.toLowerCase().trim()))
              const uniqueSegments = newSegments.filter(seg => 
                !existingContent.has(seg.content.toLowerCase().trim())
              )

              return {
                ...s,
                segments: [...s.segments, ...uniqueSegments],
                isTranscribing: true,
              }
            })
          }
          return
        }

        // Fallback message handling
        if (msg.message && msg.message !== 'SERVER_READY') {
          setState(s => ({
            ...s,
            isTranscribing: true,
            transcript: s.transcript + msg.message
          }))
        }
      } catch (err) {
        console.warn('[OptimizedWhisperLive] Failed to parse message:', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[OptimizedWhisperLive] 🔴 WebSocket closed:', event.code, event.reason)
      setState(s => ({ ...s, isConnected: false, isTranscribing: false }))
      
      // Auto-reconnect logic
      if (event.code !== 1000 && connectionAttempts.current < 3) {
        connectionAttempts.current++
        console.log(`[OptimizedWhisperLive] Attempting reconnection ${connectionAttempts.current}/3`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, Math.min(1000 * Math.pow(2, connectionAttempts.current), 10000))
      }
    }

    ws.onerror = (err) => {
      console.warn('[OptimizedWhisperLive] WebSocket error:', err)
    }
  }, [config, toast])

  // Optimized transcription start
  const startTranscription = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState(s => ({ ...s, error: 'Not connected to server' }))
      return
    }

    try {
      // Enhanced system audio capture
      let systemStream: MediaStream | null = null
      if (config.audioSources?.systemAudio) {
        try {
          systemStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: false, // Don't cancel interviewer voice
              noiseSuppression: false,
            },
          })
          systemRef.current = systemStream
        } catch {
          console.warn('[OptimizedWhisperLive] System audio denied, using microphone only')
        }
      }

      // Enhanced microphone capture
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

      const ctx = ctxRef.current!
      const dest = ctx.createMediaStreamDestination()

      // Create optimized audio routing
      const micSrc = ctx.createMediaStreamSource(micStream)
      const micGain = ctx.createGain()
      micGain.gain.value = 1.0
      micSrc.connect(micGain).connect(dest)

      if (systemStream) {
        const sysSrc = ctx.createMediaStreamSource(systemStream)  
        const sysGain = ctx.createGain()
        sysGain.gain.value = 1.2 // Boost system audio slightly
        sysSrc.connect(sysGain).connect(dest)
      }

      // Create optimized processor
      const mixedSrc = ctx.createMediaStreamSource(dest.stream)
      const chunkSize = config.optimization?.chunkSize || 2048
      const processor = ctx.createScriptProcessor(chunkSize, 1, 1)

      mixedSrc.connect(processor)

      // Optimized audio processing
      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        const float32Buffer = new Float32Array(float32)
        
        // Save for recording if enabled
        if (config.saveRecording) {
          recordingBuffers.current.push(float32Buffer)
        }

        // Convert to Uint8Array for visualization (optimized)
        const ui8 = new Uint8Array(float32Buffer.length)
        for (let i = 0; i < float32Buffer.length; i++) {
          ui8[i] = Math.min(255, Math.max(0, Math.floor((float32Buffer[i] + 1) * 127.5)))
        }

        // Send to server (only if connected)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(float32Buffer.buffer)
        }

        // Update visualizer
        audioDataRef.current = ui8
        setAudioData(ui8)
        setDataUpdateTrigger(t => t + 1)
      }

      processor.connect(ctx.destination)
      processorRef.current = processor

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

        const wavView = encodeWAVOptimized(interleaved, sampleRate)
        const blob = new Blob([wavView.buffer], { type: 'audio/wav' })
        const formData = new FormData()
        formData.append('file', blob, config.outputFilename || `recording-${Date.now()}.wav`)

        const response = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        })
        
        if (!response.ok) throw new Error('Upload failed')
        
        const { url } = await response.json()
        const recording: Recording = { 
          id: Date.now().toString(), 
          url, 
          blob 
        }
        
        setRecordings(rs => [...rs, recording])
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