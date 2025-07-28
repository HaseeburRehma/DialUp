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

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // pull in the single source of truth  
  const { settings, setSettings } = useSettings()

  // track whether the user has made changes yet
  const [hasChanges, setHasChanges] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

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
      <div className="space-y-6">
        {/* Transcription Settings */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Transcription Settings</CardTitle>
                <CardDescription>
                  Configure live vs batch transcription and WhisperLive parameters.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setModalOpen(true)}>
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Post Processing</CardTitle>
                <CardDescription>
                  Configure post-processing of recording transcriptions with AI models.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={resetSettings}>
                Reset Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Post-Processing</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically correct transcripts with AI prompt.
                </p>
              </div>
              <Switch
                checked={settings.postProcessing.enabled}
                onCheckedChange={val => updatePostProcessing('enabled', val)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Correction Prompt</Label>
              <p className="text-sm text-muted-foreground">
                Prompt for refining transcripts.
              </p>
              <Textarea
                id="prompt"
                value={settings.postProcessing.prompt}
                onChange={e => updatePostProcessing('prompt', e.target.value)}
                disabled={!settings.postProcessing.enabled}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={!hasChanges}>
                Save All Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
