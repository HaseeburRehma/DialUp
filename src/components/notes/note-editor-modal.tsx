'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { NoteRecorder, NoteRecorderHandle } from './note-recorder'
import { TranscriptDisplay } from './transcript-display'
import { TranscriptSegmentsDisplay } from './transcript-segments-display'

import { WhisperLiveHandle, WhisperLiveRecorder } from './whisper-live-recorder'
import { Save, RotateCcw } from 'lucide-react'
import { useUserSettings } from '@/hooks/use-user-settings'
import { useSettings } from '@/hooks/SettingsContext'
import { useWhisperLive } from '@/hooks/use-whisper-live'
import type { Segment } from '@/types/transcription';
import { RecordingsList, Recording } from './recordings-list';

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  createdAt: string
  updatedAt: string
}

interface NoteEditorModalProps {
  open: boolean
  note?: Note | null
  onClose: () => void
  onSave: () => void
}

export function NoteEditorModal({ open, note, onClose, onSave }: NoteEditorModalProps) {
  // always call hooks at the top
  const { settings } = useSettings()
  const transcription = settings.transcription
  const liveRef = useRef<WhisperLiveHandle>(null);

  const { transcriptionMode, whisperlive } = transcription
  const savedRecs: Recording[] =
    note?.audioUrls?.map((url: string, i: number) => ({
      id: `saved-${i}`,
      url
    })) ?? [];
  /**useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (transcriptionMode === 'live' && whisperlive.enabled) {
      timeout = setTimeout(() => {
        liveRef.current?.connect();
        liveRef.current?.startTranscription();
      }, 1000);
    } else {
      liveRef.current?.stopTranscription();
      liveRef.current?.disconnect();
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [transcriptionMode, whisperlive.enabled]);
**/




  const [formData, setFormData] = useState({
    callerName: note?.callerName || '',
    callerEmail: note?.callerEmail || '',
    callerLocation: note?.callerLocation || '',
    callerAddress: note?.callerAddress || '',
    callReason: note?.callReason || '',
  })
  const [noteText, setNoteText] = useState(note?.text || '')
  const [isSaving, setIsSaving] = useState(false)
  const recorderRef = useRef<NoteRecorderHandle>(null)
  const { toast } = useToast()

  interface Segment {
    id: string;
    content: string;
    speaker?: string;
    volume?: number;
  }
  useEffect(() => {
    if (open && note) {
      setNoteText(note.text)
      setFormData({
        callerName: note.callerName || '',
        callerEmail: note.callerEmail || '',
        callerLocation: note.callerLocation || '',
        callerAddress: note.callerAddress || '',
        callReason: note.callReason || '',
      })
      setLiveSegments(
        note.text
          ? note.text.split('\n').map((line, i) => ({
            id: `${i}`,
            content: line,
            speaker: 'User',
            volume: 1, // or 0 if needed
          }))
          : []
      )

      recorderRef.current?.setAudioUrls(note.audioUrls || [])
    }
  }, [open, note])

  // if for any reason transcription isn't loaded yet, avoid rendering recorder
  if (!transcription) {
    return null
  }

  const extractFields = (text: string) => {
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const nameMatch = line.match(/(?:Hi|Hello|Good (?:Morning|Afternoon|Evening))\s+([A-Za-z]+)/i)
      if (nameMatch?.[1]) setFormData(prev => ({ ...prev, callerName: nameMatch[1].trim() }))

      const emailMatch = line.match(/(?:my email is|confirm (?:my )?email(?: address)?|email)[:\s]*([^\s]+)/i)
      if (emailMatch?.[1]) setFormData(prev => ({ ...prev, callerEmail: emailMatch[1].trim() }))

      const locMatch = line.match(/(?:my location is|I'm in|I am in|I live in)\s+(.+)/i)
      if (locMatch?.[1]) setFormData(prev => ({ ...prev, callerLocation: locMatch[1].trim() }))

      const addrMatch = line.match(/my address is\s+(.+)/i)
      if (addrMatch?.[1]) setFormData(prev => ({ ...prev, callerAddress: addrMatch[1].trim() }))

      const reasonMatch = line.match(/(?:reason for call(?: is)?|I need help with)[:\s]*([\s\S]+)/i)
      if (reasonMatch?.[1]) setFormData(prev => ({ ...prev, callReason: reasonMatch[1].trim() }))
    }
  }

  const [liveSegments, setLiveSegments] = useState<Segment[]>([])

  // batch (string) handler
  const handleTranscription = useCallback((text: string) => {
    setNoteText(text);
    extractFields(text);
  }, [extractFields]);

  // live (Segment[]) handler
  const handleLiveTranscription = useCallback((segments: Segment[]) => {
    const full = segments.map(s => s.content).join('\n');
    setNoteText(full);
    setLiveSegments(segments);
    extractFields(full);
  }, [extractFields]);


  const resetNote = () => {
    setNoteText(note?.text || '')
    setFormData({
      callerName: note?.callerName || '',
      callerEmail: note?.callerEmail || '',
      callerLocation: note?.callerLocation || '',
      callerAddress: note?.callerAddress || '',
      callReason: note?.callReason || '',
    })
    recorderRef.current?.resetRecordings()
  }

  const handleSave = async () => {
    const isLive = transcription.transcriptionMode === 'live' && whisperlive.enabled;
    // grab recordings from the correct source
    const recs = isLive
      ? await liveRef.current!.uploadRecordings()
      : await recorderRef.current!.uploadRecordings();

    if (!noteText.trim()) return;
    setIsSaving(true);

    try {
      // upload all blobs (live or batch) and collect URLs
      const audioUrls = await Promise.all(
        recs.map(async (rec) => {
          if (rec.blob) {
            const fd = new FormData();
            fd.append('file', rec.blob);
            const resp = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!resp.ok) throw new Error('Upload failed');
            const { url } = await resp.json();
            return url;
          }
          return rec.url;
        })
      );

      // send note to your API
      const payload = { text: noteText, audioUrls, ...formData };
      const url = note ? `/api/notes/${note.id}` : '/api/notes';
      const method = note ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to save');

      toast({
        title: note ? 'Note Updated' : 'Note Saved',
        description: 'Saved successfully.',
      });

      recorderRef.current?.resetRecordings();
      onSave();
      onClose();
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Failed to save note.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open}
      onOpenChange={(val) => {
        if (!val) onClose()
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-auto">
          <div className="flex-1 space-y-4">
            {transcriptionMode === 'live' && whisperlive.enabled ? (
              <>
                <TranscriptSegmentsDisplay segments={liveSegments} />

                {/* show the old URLs */}
                {savedRecs.length > 0 && (
                  <RecordingsList
                    recordings={savedRecs}
                    onDelete={() => {
                      /* you could disable deletion of saved URLs if you like */
                    }}
                  />
                )}

                <WhisperLiveRecorder
                  ref={liveRef}
                  onSegments={handleLiveTranscription}
                />
              </>
            ) : (
              <>
                <TranscriptDisplay transcript={noteText} />
                <NoteRecorder
                  ref={recorderRef}

                  audioUrls={note?.audioUrls}
                  onTranscription={handleTranscription}
                />
              </>
            )}

          </div>

          {/* Right: Form */}
          <div className="w-1/3 space-y-4">
            <div className="grid grid-cols-1 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="callerName">Caller Name *</Label>
                <Input
                  id="callerName"
                  value={formData.callerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="callerEmail">Caller Email *</Label>
                <Input
                  id="callerEmail"
                  type="email"
                  value={formData.callerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerEmail: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="callerLocation">Caller Location *</Label>
                <Input
                  id="callerLocation"
                  value={formData.callerLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerLocation: e.target.value }))}
                  placeholder="New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="callerAddress">Caller Address *</Label>
                <Input
                  id="callerAddress"
                  value={formData.callerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, callerAddress: e.target.value }))}
                  placeholder="123 Main St, Apt 4B"
                />
              </div>

              <div>
                <Label htmlFor="callReason">Reason for Call *</Label>
                <Textarea
                  id="callReason"
                  value={formData.callReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, callReason: e.target.value }))}
                  placeholder="Project kick-off"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetNote} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button onClick={handleSave} disabled={!noteText.trim() || isSaving}>
            <Save className="w-4 h-4 mr-2" />{note ? 'Save Changes' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

