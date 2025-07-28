'use client'

import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Segment } from '@/types/transcription';


export interface Recording { id: string; url: string; blob?: Blob }


export interface WhisperLiveConfig {
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
    audioSources?: { microphone: boolean; systemAudio: boolean }
}

interface WhisperLiveState {
    isConnected: boolean
    isTranscribing: boolean
    transcript: string
    error: string | null
    segments: Segment[];
}
function encodeWAV(samples: Float32Array, sampleRate: number): DataView {
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = bytesPerSample // mono
    const byteRate = sampleRate * blockAlign
    const dataSize = samples.length * bytesPerSample
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* file length minus first 8 bytes */
    view.setUint32(4, 36 + dataSize, true)
    /* WAVE type */
    writeString(view, 8, 'WAVE')
    /* fmt  chunk */
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)                // chunk length
    view.setUint16(20, 1, true)                 // PCM
    view.setUint16(22, 1, true)                 // mono
    view.setUint32(24, sampleRate, true)        // sampleRate
    view.setUint32(28, byteRate, true)          // byteRate
    view.setUint16(32, blockAlign, true)        // blockAlign
    view.setUint16(34, bitsPerSample, true)     // bitsPerSample
    /* data chunk */
    writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    // write PCM samples
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
        // clamp
        const s = Math.max(-1, Math.min(1, samples[i]))
        // scale to 16‑bit int
        view.setInt16(
            offset,
            s < 0 ? s * 0x8000 : s * 0x7FFF,
            true
        )
        offset += 2
    }

    return view
}

function writeString(view: DataView, offset: number, s: string) {
    for (let i = 0; i < s.length; i++) {
        view.setUint8(offset + i, s.charCodeAt(i))
    }
}
export function useWhisperLive(config: WhisperLiveConfig, initialRecordings: Recording[] = []) {
    const [recordings, setRecordings] = useState<Recording[]>(initialRecordings)

    const [state, setState] = useState<WhisperLiveState>({
        isConnected: false,
        isTranscribing: false,
        transcript: '',
        error: null,
        segments: [],
    })
    const [audioData, setAudioData] = useState<Uint8Array | null>(null)
    const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)
    const wsRef = useRef<WebSocket | null>(null)
    const recordingBuffers = useRef<Float32Array[]>([])
    const sampleRateRef = useRef<number>(0)
    const lastSegmentIndexRef = useRef(0)
    const audioDataRef = useRef<Uint8Array | null>(null);

    const resetSegments = useCallback(() => {
        setState(s => ({ ...s, segments: [], transcript: '' }));
    }, []);
    const resetRecordings = useCallback(() => {
        setRecordings([]);
    }, []);
    const uidRef = useRef(
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
    )
    const { toast } = useToast()

    const connect = useCallback(async () => {
        await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        console.log('[useWhisperLive] got mic permission');
        console.log('[useWhisperLive]  connect()', config);
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        // 1) create AudioContext now so we can hand its real sampleRate to the server
        const ctx = new AudioContext({ sampleRate: 16000 })
        ctxRef.current = ctx

        // immediately save out the sampleRate for later WAV encoding
        sampleRateRef.current = ctx.sampleRate

        // clear out any old floats from a previous session
        recordingBuffers.current = []

        console.log('[useWhisperLive] audioContext.sampleRate =', sampleRateRef.current)
        setState(s => ({ ...s, error: null }))

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

        // if the user typed “localhost”, swap to 127.0.0.1
        const host =
            config.serverUrl === 'localhost' || config.serverUrl === '::1'
                ? '127.0.0.1'
                : config.serverUrl;

        const ws = new WebSocket(`${protocol}://${host}:${config.port}`);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;
        lastSegmentIndexRef.current = 0;


        ws.onopen = async () => {
            console.log('[useWhisperLive] 🟢 WebSocket OPEN');
            const taskName = 'transcribe'
            ws.send(
                JSON.stringify({
                    task: taskName,
                    uid: uidRef.current,
                    language: config.language,
                    model: config.model,
                    use_vad: false,
                    stream: true,
                    // only send us the newest segment each time:

                    save_recording: config.saveRecording,
                    output_filename: config.outputFilename,
                    max_clients: config.maxClients,
                    max_connection_time: config.maxConnectionTime > 0
                        ? config.maxConnectionTime
                        : 1200,
                    // **important**: must match your AudioContext & ScriptProcessor
                    sample_rate: sampleRateRef.current,
                    chunk_size: 4096,
                }),
            )
            
           await startTranscription();
            setState(s => ({ ...s, isConnected: true }))
        }
        const clearAll = () => {
            recordingBuffers.current = []
            setState(s => ({ ...s, transcript: '', segments: [] }))
        }
        // inside your connect()
        ws.onmessage = e => {
            console.log('Raw WS Message:', e.data)
            if (typeof e.data !== 'string') return;
            const msg = JSON.parse(e.data);

            // ignore handshake
            if (msg.message === 'SERVER_READY') return;

            // errors
            if (msg.type === 'error') {
                setState(s => ({ ...s, error: msg.message }));
                return;
            }

            // old‐style partial/final (if you ever toggle that back on)
            if (msg.type === 'partial' || msg.type === 'transcript') {
                setState(s => ({
                    ...s,
                    isTranscribing: true,
                    transcript: s.transcript + msg.text
                }));
                return;
            }
            if (msg.type === 'final') {
                setState(s => ({
                    ...s,
                    isTranscribing: false,
                    transcript: s.transcript + msg.text + '\n'
                }));
                return;
            }

            // ← NEW: handle the `segments` array
            if (Array.isArray(msg.segments)) {
                // compute RMS over your latest audioData as before
                let rms = 0;
                if (audioDataRef.current) {
                    const data = audioDataRef.current;
                    let sum = 0;
                    for (const x of data) sum += (x - 128) ** 2;
                    rms = Math.sqrt(sum / data.length) / 128;
                }

                // *Always* map *all* segments the server just sent:
                const segments: Segment[] = msg.segments.map(wsSeg => ({
                    speaker: wsSeg.speaker === 0 ? 'mic' : 'speaker',
                    content: wsSeg.text,
                    volume: rms,
                }));

                setState(s => ({
                    ...s,
                    segments,
                    isTranscribing: true,
                }));
                return;
            }





            // fallback to any stray `msg.message`
            if (msg.message && msg.message !== 'SERVER_READY') {
                setState(s => ({
                    ...s,
                    isTranscribing: true,
                    transcript: s.transcript + msg.message
                }));
            }
        };





        ws.onclose = () => {
            // stopTranscription()
            setState(s => ({ ...s, isConnected: false, isTranscribing: false }))
        }

        ws.onerror = (err) => {
            console.warn('[useWhisperLive] WebSocket error (non‑fatal)', err);
            // don’t setState or toast here
        };
    }, [config, toast])

    const micRef = useRef<MediaStream | null>(null)
    const systemRef = useRef<MediaStream | null>(null)
    const ctxRef = useRef<AudioContext | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)

    const startTranscription = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setState(s => ({ ...s, error: 'Not connected' }));
            return;
        }

        try {
            // 1) Screen + system audio (if enabled)
            let systemStream: MediaStream | null = null;
            if (config.audioSources?.systemAudio) {
                try {
                    systemStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: true,
                    });
                    systemRef.current = systemStream;
                } catch {
                    console.warn('System audio share denied or not requested; falling back to mic only');
                }
            }

            // 2) Microphone
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1 },
            });
            micRef.current = micStream;


            const ctx = ctxRef.current!
            const dest = ctx.createMediaStreamDestination()

            // 4) Wire mic → dest
            const micSrc = ctx.createMediaStreamSource(micStream);
            micSrc.connect(dest);

            // 5) Wire system audio → dest
            if (systemStream) {
                const sysSrc = ctx.createMediaStreamSource(systemStream);
                sysSrc.connect(dest);
            }

            // 6) Instead of wiring mic+sys directly to the processor, we
            //    take the mixed dest.stream and hook that up:
            const mixedSrc = ctx.createMediaStreamSource(dest.stream);

            // 7) Create your ScriptProcessor (bufferSize=4096, mono in/out)
            const processor = ctx.createScriptProcessor(4096, 1, 1);

            // 8) Wire the mixed audio into the processor
            mixedSrc.connect(processor);

            // 9) On each onaudioprocess, build exactly one packet
            processor.onaudioprocess = e => {
                const float32 = e.inputBuffer.getChannelData(0)
                const float32Buffer = new Float32Array(float32)
                if (config.saveRecording) {
                    recordingBuffers.current.push(float32Buffer)
                }
                // → convert to Uint8Array [0..255]
                const ui8 = new Uint8Array(float32Buffer.length)
                for (let i = 0; i < float32Buffer.length; i++) {
                    ui8[i] = Math.min(
                        255,
                        Math.max(0, Math.floor((float32Buffer[i] + 1) * 127.5))
                    )
                }

                // send raw float32 PCM to server
                if (wsRef.current!.readyState === WebSocket.OPEN) {
                    wsRef.current!.send(float32Buffer.buffer)
                }

                // update visualizer
                setAudioData(ui8)
                setDataUpdateTrigger(t => t + 1)
            }

            // 10) Start it
            processor.connect(ctx.destination);
            processorRef.current = processor;

            setState(s => ({ ...s, isTranscribing: true }));
        }
        catch (err: any) {
            setState(s => ({ ...s, error: `Failed to start transcription: ${err.message}` }));
            toast({ title: 'Transcription Error', description: err.message, variant: 'destructive' });
        }
    }, [config, toast]);


    const stopTranscription = useCallback(async () => {
        // 1) tell the server “END_OF_AUDIO”
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(new TextEncoder().encode("END_OF_AUDIO"));
        }

        // 2) immediately tear down the ScriptProcessor & tracks
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (micRef.current) {
            micRef.current.getTracks().forEach(t => t.stop());
            micRef.current = null;
        }
        if (systemRef.current) {
            systemRef.current.getTracks().forEach(t => t.stop());
            systemRef.current = null;
        }

        // 3) if we’ve been saving, flatten + encode + upload while ctx is still open
        if (config.saveRecording && recordingBuffers.current.length) {
            console.log('[useWhisperLive] uploading WAV, buffers:', recordingBuffers.current.length)
            // ◉ use the saved sampleRate
            const sampleRate = sampleRateRef.current;

            // ◉ flatten into one Float32Array
            const totalLength = recordingBuffers.current.reduce((sum, buf) => sum + buf.length, 0);
            const interleaved = new Float32Array(totalLength);
            let offset = 0;
            for (const buf of recordingBuffers.current) {
                interleaved.set(buf, offset);
                offset += buf.length;
            }

            // ◉ encode + upload
            const wavView = encodeWAV(interleaved, sampleRate);
            const blob = new Blob([wavView.buffer], { type: 'audio/wav' });
            const form = new FormData();
            form.append('file', blob, config.outputFilename || 'recording.wav');
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: form })
                if (!res.ok) throw new Error('upload failed')
                const { url } = await res.json()
                const rec: Recording = { id: Date.now().toString(), url, blob }
                setRecordings(rs => [...rs, rec])
            } catch (err: any) {
                toast({ title: 'Upload Error', description: String(err), variant: 'destructive' })
            }
            recordingBuffers.current = []
        }

        // 4) **now** tear down your AudioContext
        if (ctxRef.current) {
            ctxRef.current.close();
            ctxRef.current = null;
        }

        // 5) finally, update state
        setState(s => ({ ...s, isTranscribing: false }));
    }, [config, toast]);




    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        stopTranscription()
        setState(s => ({
            ...s,
            isConnected: false,
            isTranscribing: false,
            transcript: '',
            error: null,
            segments: [],    // clear out any old diarized segments too
        }))
    }, [stopTranscription])

    const clearTranscript = useCallback(() => {
        setState(s => ({ ...s, transcript: '' }))
    }, [])

    return {
        state,
        connect,
        startTranscription,
        stopTranscription,
        disconnect,
        clearTranscript,
        wsRef,
        audioData,
        dataUpdateTrigger,
        recordings,
        resetSegments,
        deleteRecording: (r: Recording) => setRecordings(rs => rs.filter(x => x.id !== r.id)),
        resetRecordings,
    }
}
