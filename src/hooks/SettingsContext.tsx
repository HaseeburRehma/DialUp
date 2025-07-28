// hooks/SettingsContext.tsx
'use client'

import React, {
  createContext, useContext, useState, useEffect, ReactNode
} from 'react'
import { useSession } from 'next-auth/react'
import { DEFAULT_SETTINGS, Settings } from './use-user-settings'
import { toast } from '@/hooks/use-toast'

interface ContextType {
  settings: Settings
  setSettings: (s: Settings) => void
}

const SettingsContext = createContext<ContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [settings, _setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // fetch on mount (once we know who the user is)
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(db => {
        _setSettings(prev => ({
          ...prev,
          transcription: {
            transcriptionMode: db.transcriptionMode,
            audioSources:    db.audioSources,
            transcriptionModel: db.transcriptionModel,
            language:        db.language,
            autoPunctuation: db.autoPunctuation,
            whisperlive:     db.whisperlive
          }
        }))
      })
      .catch(err => {
        console.error('Could not load settings:', err)
        toast({ title: 'Error', description: 'Failed to load your settings', variant: 'destructive' })
      })
      .finally(() => setLoaded(true))
  }, [status])

  const setSettings = (next: Settings) => {
    _setSettings(next)
    // persist
    fetch('/api/settings', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptionMode: next.transcription.transcriptionMode,
        audioSources:      next.transcription.audioSources,
        transcriptionModel: next.transcription.transcriptionModel,
        language:          next.transcription.language,
        autoPunctuation:   next.transcription.autoPunctuation,
        whisperlive:       next.transcription.whisperlive
      })
    }).then(r => {
      if (!r.ok) throw new Error('Save failed')
    }).catch(err => {
      console.error('Could not save settings:', err)
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    })
  }

  // don't render your app until we've checked the DB
  if (status === 'authenticated' && !loaded) {
    return null
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
