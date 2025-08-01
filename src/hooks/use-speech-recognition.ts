// src/hooks/use-speech-recognition.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'

type ResultCallback = (text: string, isFinal: boolean) => void
type Options = { continuous: boolean; interimResults: boolean; lang: string }

export function useSpeechRecognition(
  onResult: ResultCallback,
  options: Options
) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser.')
      return
    }

    const recog = new SpeechRecognition()
    recog.continuous = options.continuous
    recog.interimResults = options.interimResults
    recog.lang = options.lang

    recog.onresult = (evt: SpeechRecognitionEvent) => {
      let interim = ''
      let finalText = ''
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const res = evt.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else interim += res[0].transcript
      }
      if (interim) onResult(interim, false)
      if (finalText) onResult(finalText, true)
    }

    recog.onend = () => {
      if (options.continuous) {
        recog.start()
      }
    }

    recog.onerror = e => console.error('Speech recognition error', e)
    recognitionRef.current = recog

    return () => {
      recog.onresult = null
      recog.onend = null
      recog.onerror = null
      recog.stop?.()
    }
  }, [onResult, options.continuous, options.interimResults, options.lang])

  const start = useCallback(() => recognitionRef.current?.start(), [])
  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  return { start, stop }
}
