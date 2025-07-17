// src/components/notes/NoteRecorder.tsx
'use client'

import React, {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AudioVisualizer } from './audio-visualizer'
import { RecordingsList, Recording } from './recordings-list'
import { useMediaRecorder } from '@/hooks/use-media-recorder'
import { useRecordings } from '@/hooks/use-recordings'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { WhisperLiveRecorder } from './whisper-live-recorder'
import { Save, RotateCcw } from 'lucide-react'
import { useUserSettings } from '@/hooks/use-user-settings'
export interface NoteRecorderHandle {
  uploadRecordings: () => Promise<Recording[]>
  resetRecordings: () => void
  isBusy: boolean
}

interface NoteRecorderProps {
  audioUrls?: string[]
  onTranscription: (text: string) => void
}

export const NoteRecorder = forwardRef<NoteRecorderHandle, NoteRecorderProps>(function NoteRecorder(
  { audioUrls = [], onTranscription },
  ref
) {
  const { toast } = useToast()

  // Media recorder state & controls
  const { state, startRecording, stopRecording } = useMediaRecorder()
  const { isRecording, recordingDuration, audioData, updateTrigger } = state

  // Manage list of recordings (in-memory + seeded)
  const { recordings, addRecording, removeRecording, resetRecordings } =
    useRecordings(audioUrls)

  

  // Speech-to-text fallback
  const [liveTranscript, setLiveTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const lastInterim = useRef('')
  const lastFinal = useRef('')

  const onSpeechResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (!isFinal) {
        const delta = text.slice(lastInterim.current.length)
        if (delta) {
          lastInterim.current = text
          setLiveTranscript(text)
          onTranscription(finalTranscript + delta)
        }
      } else {
        const updated = lastFinal.current + text + ' '
        lastFinal.current = updated
        setFinalTranscript(updated)
        setLiveTranscript('')
        onTranscription(updated)
      }
    },
    [finalTranscript, onTranscription]
  )

  const { start: startRecognition, stop: stopRecognition } =
    useSpeechRecognition(onSpeechResult, {
      continuous: true,
      interimResults: true,
      lang: 'en-US',
    })

  useEffect(() => {
    if (isRecording) startRecognition()
    else stopRecognition()
    return () => { stopRecognition() }
  }, [isRecording, startRecognition, stopRecognition])

  // Handle starting
  const handleStart = async () => {
    setFinalTranscript('')
    setLiveTranscript('')
    lastInterim.current = ''
    lastFinal.current = ''
    try {
      await startRecording()
    } catch (err) {
      console.error(err)
      toast({ title: 'Recording Error', description: 'Could not start recording.', variant: 'destructive' })
    }
  }

  // Handle stopping: upload, add UI entry, then transcribe
  const [isTranscribing, setIsTranscribing] = useState(false)
  const transcribingMessage = 'Transcribing...'

  const handleStop = async () => {
    try {
      stopRecognition()
      const blob = await stopRecording()

      // Upload blob to server
      const form = new FormData()
      form.append('file', blob)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()

      // Add new recording (use server URL)
      const id = Date.now().toString()
      addRecording({ id, url, blob })

      // Then transcribe in background
      await transcribeViaWhisper(blob)
    } catch (err) {
      console.error(err)
      toast({ title: 'Recording Error', description: 'Could not stop recording.', variant: 'destructive' })
    }
  }

  // Transcription via Whisper; no longer adds recording here
  const transcribeViaWhisper = async (blob: Blob) => {
    setIsTranscribing(true)
    try {
      const form = new FormData()
      form.append('audio', blob)
      form.append('diarize', 'true')
      const r = await fetch('/api/server/transcribe', { method: 'POST', body: form })
      if (!r.ok) throw new Error('Whisper failed')
      const { text } = await r.json()

      const segments = text.split(/\r?\n/).map(line => {
        const m = line.match(/^Speaker (\d+):\s*(.*)$/)
        return m
          ? { speaker: m[1] === '0' ? 'user' : 'system', content: m[2] }
          : { speaker: 'system', content: line }
      })
      const combined = segments.map(s => s.content).join('\n')
      onTranscription(combined)
    } catch (e) {
      console.error(e)
      toast({ title: 'Transcription Error', description: 'Failed to transcribe.', variant: 'destructive' })
    } finally {
      setIsTranscribing(false)
    }
  }

  // Toggle
  const toggleRecording = () => (isRecording ? handleStop() : handleStart())

  // Clear
  const handleClearAll = () => {
    stopRecognition()
    resetRecordings()
    setFinalTranscript('')
    setLiveTranscript('')
    lastInterim.current = ''
    lastFinal.current = ''
    onTranscription('')
  }

  // expose API
  useImperativeHandle(
    ref,
    () => ({ uploadRecordings: async () => recordings, resetRecordings, isBusy: isRecording || isTranscribing }),
    [recordings, isRecording, isTranscribing, resetRecordings]
  )

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Recordings & Transcripts</CardTitle>
        <div className="flex items-center gap-2">
          {isRecording && (
            <><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span>{formatDuration(recordingDuration)}</span></>
          )}
          <Button size="sm" variant={isRecording ? 'destructive' : 'default'} onClick={toggleRecording} disabled={isTranscribing}>
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          {(finalTranscript || liveTranscript) && (
            <Button size="sm" variant="ghost" onClick={handleClearAll} title="Clear all">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isRecording && audioData && (
          <AudioVisualizer audioData={audioData} dataUpdateTrigger={updateTrigger} />
        )}

        {isRecording && liveTranscript && (<div className="p-2 bg-yellow-100 rounded text-sm italic">{liveTranscript}</div>)}
        {(!isRecording || !liveTranscript) && finalTranscript && <div>{finalTranscript}</div>}

        {isTranscribing && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{transcribingMessage}</span>
          </div>
        )}

        <RecordingsList recordings={recordings} onDelete={removeRecording} />

        {!recordings.length && !isRecording && !isTranscribing && (
          <p className="text-center text-muted-foreground">No recordings yet. Tap the mic to start.</p>
        )}
      </CardContent>
    </Card>
  )
})

NoteRecorder.displayName = 'NoteRecorder'
