// src/hooks/use-optimized-whisper-live.ts


import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Segment } from '@/types/transcription'
import { logger, logError, logWarn } from '@/lib/logger'

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
  const wsMicRef = useRef<WebSocket | null>(null);
  const wsSysRef = useRef<WebSocket | null>(null);

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
    if (normalized.length < 3) return true // Ignore very short texts

    if (transcriptHistoryRef.current.has(normalized)) {
      return true
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

      // ✅ NEW: Also clean up old segment history (keep last 100 entries within 5 minutes)
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      for (const [key, timestamp] of Array.from(segmentHistoryRef.current.entries())) {
        if (timestamp < fiveMinutesAgo) {
          segmentHistoryRef.current.delete(key);
        }
      }

      // Limit size
      if (segmentHistoryRef.current.size > 100) {
        const entries = Array.from(segmentHistoryRef.current.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by timestamp descending
          .slice(0, 50); // Keep most recent 50
        segmentHistoryRef.current.clear();
        entries.forEach(([key, val]) => segmentHistoryRef.current.set(key, val));
      }
    }
  }, [normalizeText])

  // Helper function to calculate text similarity
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    // Count matching characters
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
  }, [])

  // --- Add this above the connect() definition ---
  function openRoleSocket(role: 'agent' | 'caller'): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const base = process.env.NEXT_PUBLIC_WS_BASE || `${protocol}://${window.location.host}`;
    const wsUrl = process.env.NEXT_PUBLIC_WHISPER_WS || `${base}/whisper`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      ws.send(JSON.stringify({
        task: 'transcribe',
        uid: `${uidRef.current}-${role}`,
        language: config.language,
        model: config.model,
        use_vad: false,                     // ✅ DISABLED: VAD removes speech, not needed with small chunks
        stream: true,
        save_recording: config.saveRecording,
        output_filename: `${config.outputFilename}-${role}.wav`,
        sample_rate: sampleRateRef.current,

        // ✅ CRITICAL SERVER SETTINGS for instant transcription
        chunk_size: 1024,                   // ✅ Very small = process immediately
        beam_size: 1,                       // ✅ Fastest decoding (greedy)
        best_of: 1,                         // ✅ No sampling, instant results

        // ✅ Deduplication settings
        same_output_threshold: 0.0,         // ✅ DISABLED: Let client handle dedup
        no_speech_thresh: 0.6,              // ✅ Higher = less false positives

        // Additional speed optimizations
        condition_on_previous_text: false,  // ✅ Don't wait for context
        prompt_reset_on_temperature: 0.5
      }));
    };

    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 10000);

    ws.onmessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);

        if (Array.isArray(msg.segments)) {
          const now = Date.now();
          const newSegments: Segment[] = [];

          for (const wsSeg of msg.segments) {
            let text = (wsSeg.text || '').trim();
            if (!text || text.length < 3) continue;

            const norm = normalizeText(text);

            // ✅ Track the LONGEST text we've ever seen from this role
            const roleKey = `longest_${role}`;
            const longestSeen = sessionStorage.getItem(roleKey) || '';
            const longestNorm = normalizeText(longestSeen);

            // ✅ If current text is contained in what we've seen, skip entirely
            if (longestNorm.includes(norm)) {
              continue;
            }

            // ✅ If current text CONTAINS what we've seen, extract ONLY the new part
            if (norm.includes(longestNorm) && longestNorm.length > 0) {
              // Find where the old text ends in the new text
              const oldTextEnd = text.toLowerCase().lastIndexOf(longestSeen.toLowerCase().substring(Math.max(0, longestSeen.length - 50)));

              if (oldTextEnd > 0) {
                // Extract only the new portion
                text = text.substring(oldTextEnd + Math.min(50, longestSeen.length)).trim();

                if (text.length < 3) continue;
              }
            }

            // ✅ Check against recent segments (quick dedup)
            const recentDup = Array.from(segmentHistoryRef.current.entries())
              .some(([prevNorm, prevTime]) => {
                if (now - prevTime > 5000) return false; // Only check last 5 seconds
                return normalizeText(text).includes(prevNorm) || prevNorm.includes(normalizeText(text));
              });

            if (recentDup) continue;

            // ✅ Update longest seen for this role
            if (norm.length > longestNorm.length) {
              sessionStorage.setItem(roleKey, text);
            }

            // ✅ Add to history
            segmentHistoryRef.current.set(normalizeText(text), now);

            // ✅ Create segment with ONLY new content
            newSegments.push({
              id: `${role}-${now}-${Math.random().toString(36).slice(2, 6)}`,
              speaker: role,
              text: text,
              content: text,
              isFinal: true,
              timestamp: now,
              confidence: wsSeg.confidence ?? 0.8
            });
          }

          // Only update if we have truly new segments
          if (newSegments.length) {
            setState(s => ({
              ...s,
              segments: [...s.segments, ...newSegments],
              isTranscribing: true
            }));
          }
        }

        if ((msg.type === 'final' || msg.type === 'transcript') && msg.text) {
          const t = msg.text.trim();
          if (t && !isDuplicate(t)) {
            addToHistory(t);
            setState(s => ({
              ...s,
              transcript: s.transcript
                ? `${s.transcript}\n👤 ${role === 'agent' ? 'Agent' : 'Caller'}\n${t}`
                : `👤 ${role === 'agent' ? 'Agent' : 'Caller'}\n${t}`,
            }));
          }
        }
      } catch (error) {
        logError('[OptimizedWhisperLive] Message parsing error', error)
      }
    };

    ws.onclose = (event: CloseEvent) => {
      logWarn(`[OptimizedWhisperLive] ${role} socket closed:`, { code: event.code, reason: event.reason });
    };

    ws.onerror = (event: Event) => {
      logWarn(`[OptimizedWhisperLive] WebSocket error for ${role}`);
    };

    return ws;
  }

  // Enhanced connection with retry logic
  const connect = useCallback(async () => {
    logger.log('[OptimizedWhisperLive] Connecting with enhanced performance...')

    // Clear history on new connection
    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()
    lastProcessedMessageRef.current = ''

    // ✅ Clear longest-seen tracking
    sessionStorage.removeItem('longest_agent')
    sessionStorage.removeItem('longest_caller')

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



    // Create optimized AudioContext
    const ctx = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    })
    ctxRef.current = ctx
    sampleRateRef.current = ctx.sampleRate
    recordingBuffers.current = []

    setState(s => ({ ...s, error: null }))
    wsMicRef.current = openRoleSocket('agent');
    wsSysRef.current = openRoleSocket('caller');
    setState(s => ({ ...s, isConnected: true }));
    await startTranscription();

  }, [config, toast, isDuplicate, addToHistory, normalizeText])

  // Optimized transcription start
  const startTranscription = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      micRef.current = micStream;

      let systemStream: MediaStream | null = null;
      if (config.audioSources?.systemAudio) {
        try {
          systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          systemRef.current = systemStream;
        } catch (error) {
          logWarn('[OptimizedWhisperLive] System audio denied', error);
        }
      }

      const ctx = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
      ctxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;

      // ✅ Add the combined block here
      const destination = ctx.createMediaStreamDestination();

      if (micStream) {
        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }
      if (systemStream) {
        const sysSource = ctx.createMediaStreamSource(systemStream);
        sysSource.connect(destination);
      }

      const mixSource = ctx.createMediaStreamSource(destination.stream);
      // ✅ Balanced: 4096 = good quality + fast streaming (~250ms per chunk)
      const processor = ctx.createScriptProcessor(config.optimization?.chunkSize || 4096, 1, 1);
      mixSource.connect(processor);
      processor.connect(ctx.destination);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const clone = new Float32Array(input);
        const rms = Math.sqrt(clone.reduce((s, v) => s + v * v, 0) / clone.length);
        if (rms < 0.0002) return;
        if (performanceRef.current.messageCount++ % 20 === 0)
          console.debug('RMS:', rms.toFixed(6));
        if (config.saveRecording) recordingBuffers.current.push(clone);

        // visualize
        const ui8 = new Uint8Array(clone.length);
        for (let i = 0; i < clone.length; i++)
          ui8[i] = Math.min(255, Math.max(0, Math.floor((clone[i] + 1) * 127.5)));
        audioDataRef.current = ui8;
        setAudioData(ui8);
        setDataUpdateTrigger((t) => t + 1);

        if (wsMicRef.current?.readyState === WebSocket.OPEN) {
          wsMicRef.current.send(clone.buffer);
        }
      };

      processorRef.current = processor;

      setState((s) => ({ ...s, isTranscribing: true, error: null }));
    } catch (err: any) {
      setState((s) => ({ ...s, error: `Failed to start transcription: ${err.message}` }));
      toast({ title: 'Transcription Error', description: err.message, variant: 'destructive' });
    }
  }, [config, toast]);


  // Optimized transcription stop
  // Optimized transcription stop
  const stopTranscription = useCallback(async () => {
    logger.log('[OptimizedWhisperLive] Stopping transcription...')

    //  Close all WebSockets
    if (wsMicRef.current?.readyState === WebSocket.OPEN) wsMicRef.current.close(1000, 'Normal Closure')
    wsMicRef.current = null
    if (wsSysRef.current?.readyState === WebSocket.OPEN) wsSysRef.current.close(1000, 'Normal Closure')
    wsSysRef.current = null

    //  Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }




    //  Stop all input tracks
    if (micRef.current) {
      micRef.current.getTracks().forEach(t => t.stop())
      micRef.current = null
    }
    if (systemRef.current) {
      systemRef.current.getTracks().forEach(t => t.stop())
      systemRef.current = null
    }

    //  Handle recording upload
    if (config.saveRecording && recordingBuffers.current.length > 0) {
      console.log(
        '[OptimizedWhisperLive] Processing recording...',
        recordingBuffers.current.length,
        'buffers'
      )

      try {
        const sampleRate = sampleRateRef.current
        const totalLength = recordingBuffers.current.reduce((sum, buf) => sum + buf.length, 0)
        const interleaved = new Float32Array(totalLength)
        let offset = 0

        for (const buf of recordingBuffers.current) {
          interleaved.set(buf, offset)
          offset += buf.length
        }

        // SAFE normalization (no Math.max spread)
        let maxAmp = 0
        for (let i = 0; i < interleaved.length; i++) {
          const val = Math.abs(interleaved[i])
          if (val > maxAmp) maxAmp = val
        }
        if (maxAmp === 0) maxAmp = 1
        for (let i = 0; i < interleaved.length; i++) {
          interleaved[i] /= maxAmp
        }

        // Encode as PCM WAV
        const wavBytes = encodeWAVOptimized(interleaved, sampleRate)
        const blob = new Blob([wavBytes], { type: 'audio/wav' })
        const formData = new FormData()
        formData.append('file', blob, config.outputFilename || `recording-${Date.now()}.wav`)

        const uploadUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/upload`
          : '/api/upload'

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const { url } = await response.json()
        const recording: Recording = {
          id: Date.now().toString(),
          url,
          blob,
        }

        setRecordings(rs => [...rs, recording])
        logger.info('[OptimizedWhisperLive] Recording uploaded successfully:', url)
      } catch (err: any) {
        logError('[OptimizedWhisperLive] Upload error', err)
        toast({
          title: 'Upload Error',
          description: `Failed to save recording: ${err.message}`,
          variant: 'destructive',
        })
      }

      // Wait a tick before clearing
      await new Promise(r => setTimeout(r, 400))
      recordingBuffers.current = []
    }

    // 🧠 Close AudioContext
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      await ctxRef.current.close()
      ctxRef.current = null
    }

    // ✅ Update state
    setState(s => ({ ...s, isTranscribing: false }))
  }, [config, toast])


  // Enhanced disconnect with cleanup
  const disconnect = useCallback(() => {
    logger.log('[OptimizedWhisperLive] Disconnecting...')

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    // Close WebSocket connections
    if (wsMicRef.current?.readyState === WebSocket.OPEN) wsMicRef.current.close(1000, 'Normal Closure');
    wsMicRef.current = null;
    if (wsSysRef.current?.readyState === WebSocket.OPEN) wsSysRef.current.close(1000, 'Normal Closure');
    wsSysRef.current = null;

    // Stop transcription (but don’t clear transcript)
    stopTranscription();

    // ✅ Don’t clear transcript or segments — just mark disconnected
    setState(s => ({
      ...s,
      isConnected: false,
      isTranscribing: false,
      connectionQuality: 'excellent',
      latency: 0,
    }));

    connectionAttempts.current = 0;
  }, [stopTranscription]);

  // Utility functions
  const clearTranscript = useCallback(() => {
    transcriptHistoryRef.current.clear()
    segmentHistoryRef.current.clear()
    sessionStorage.removeItem('longest_agent')
    sessionStorage.removeItem('longest_caller')
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
