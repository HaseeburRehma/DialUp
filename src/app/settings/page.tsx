// src/app/settings/page.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useToast } from '@/hooks/use-toast'
import { TranscriptionSettingsModal } from '@/components/notes/transcription-settings-modal'
import { useSettings } from '@/hooks/SettingsContext'
import { DEFAULT_SETTINGS } from '@/hooks/use-user-settings'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // pull in the single source of truth  
  const { settings, setSettings } = useSettings()

  // track whether the user has made changes yet
  const [hasChanges, setHasChanges] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  useAuthRedirect('/api/settings')

  // save all (context is already persisting to localStorage)
  function saveSettings() {
    setHasChanges(false)
    toast({ title: 'Success', description: 'Settings saved.' })
  }

  // reset everything to defaults
  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
    setHasChanges(false)
    toast({ title: 'Reset', description: 'Settings reset to default.' })
  }

  // apply transcription changes from the modal
  function handleTranscriptionSave(transcriptionSettings: typeof settings.transcription) {
    setSettings({
      ...settings,
      transcription: transcriptionSettings
    })
    setHasChanges(true)
    setModalOpen(false)
    toast({ title: 'Transcription Settings Updated' })
  }

  // update post-processing toggles inline
  function updatePostProcessing<K extends keyof typeof settings.postProcessing>(
    key: K,
    value: typeof settings.postProcessing[K]
  ) {
    setSettings({
      ...settings,
      postProcessing: {
        ...settings.postProcessing,
        [key]: value
      }
    })
    setHasChanges(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 px-3 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Page Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">Configure your transcription and post-processing preferences</p>
        </div>

        {/* Transcription Settings */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">Transcription Settings</CardTitle>
                <CardDescription className="text-sm">
                  Configure live vs batch transcription and WhisperLive parameters.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setModalOpen(true)} size="sm" className="w-full sm:w-auto">
                Edit
              </Button>
            </div>
          </CardHeader>
        </Card>

        <TranscriptionSettingsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialSettings={settings.transcription} // ← pass it under the name the modal expects
          onSave={handleTranscriptionSave}
        />

        {/* Post-Processing */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">Post Processing</CardTitle>
                <CardDescription className="text-sm">
                  Configure post-processing of recording transcriptions with AI models.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={resetSettings} size="sm" className="w-full sm:w-auto">
                Reset Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm md:text-base">Enable Post-Processing</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Automatically correct transcripts with AI prompt.
                </p>
              </div>
              <Switch
                checked={settings.postProcessing.enabled}
                onCheckedChange={val => updatePostProcessing('enabled', val)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm md:text-base">Correction Prompt</Label>
              <p className="text-xs md:text-sm text-muted-foreground">
                Prompt for refining transcripts.
              </p>
              <Textarea
                id="prompt"
                value={settings.postProcessing.prompt}
                onChange={e => updatePostProcessing('prompt', e.target.value)}
                disabled={!settings.postProcessing.enabled}
                rows={5}
                className="font-mono text-xs md:text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveSettings} disabled={!hasChanges} className="w-full sm:w-auto">
                Save All Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
