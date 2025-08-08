'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettings } from '@/hooks/SettingsContext'

interface WhisperLiveSettingsProps {
  onSettingsChange: (settings: WhisperLiveConfig) => void
}

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

export function WhisperLiveSettings({ onSettingsChange }: WhisperLiveSettingsProps): JSX.Element {
  const { settings: { transcription } } = useSettings()
  const [cfg, setCfg] = useState<WhisperLiveConfig>(transcription.whisperlive)


  useEffect(() => {
    setCfg(transcription.whisperlive)
  }, [transcription.whisperlive])

  function handleChange<K extends keyof WhisperLiveConfig>(key: K, value: WhisperLiveConfig[K]) {
    const next: WhisperLiveConfig = {
      ...cfg,
      [key]: value,
      language: (cfg.language || transcription.language) ?? 'en', // ensure `language` exists
    }
    setCfg(next)
    onSettingsChange(next)
  }

  // ✅ Add a return block here
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhisperLive Settings</CardTitle>
      </CardHeader>
      <CardContent>
        
      </CardContent>
    </Card>
  )
}
