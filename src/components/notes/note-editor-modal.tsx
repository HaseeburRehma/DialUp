// src/components/notes/note-editor-modal.tsx

'use client'
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { NoteRecorder, NoteRecorderHandle } from './note-recorder'
import { TranscriptSegmentsDisplay } from './transcript-segments-display'
import { WhisperLiveHandle, WhisperLiveRecorder } from './whisper-live-recorder'
import { Save, RotateCcw, Sparkles, Share2, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { useSettings } from '@/hooks/SettingsContext'
import type { Segment } from '@/types/transcription'
import { RecordingsList, Recording } from './recordings-list'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  folder?: string
  tags?: string[]
  summary?: string
  shareToken?: string
  isShared?: boolean
  createdAt: string
  updatedAt: string
}

interface NoteEditorModalProps {
  open: boolean
  note?: Note | null
  folders?: string[]
  onClose: () => void
  onSave: () => void
}

export function NoteEditorModal({ open, note, folders = [], onClose, onSave }: NoteEditorModalProps) {
  const { settings } = useSettings()
  const transcription = settings?.transcription
  const transcriptionMode = transcription?.transcriptionMode
  const whisperlive = transcription?.whisperlive

  const liveRef = useRef<WhisperLiveHandle>(null)
  const recorderRef = useRef<NoteRecorderHandle>(null)
  const { toast } = useToast()

  const savedRecs: Recording[] = useMemo(
    () => note?.audioUrls?.map((url, i) => ({ id: `saved-${i}`, url })) ?? [],
    [note?.audioUrls]
  )

  const [formData, setFormData] = useState({
    callerName: note?.callerName || '',
    callerEmail: note?.callerEmail || '',
    callerLocation: note?.callerLocation || '',
    callerAddress: note?.callerAddress || '',
    callReason: note?.callReason || '',
    folder: note?.folder || 'General',
  })

  const [noteText, setNoteText] = useState(note?.text || '')
  const [summary, setSummary] = useState(note?.summary || '')
  const [shareToken, setShareToken] = useState(note?.shareToken || '')
  const [isShared, setIsShared] = useState(note?.isShared || false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [liveSegments, setLiveSegments] = useState<Segment[]>([])
  const [recordings, setRecordings] = useState<Recording[]>(savedRecs)

  // Reset all state when modal opens/closes or note changes
  useEffect(() => {
    if (open && note) {
      // Load all note data
      // Convert plain text to HTML for ReactQuill
      const htmlText = note.text
        ? note.text
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p>${line}</p>`)
          .join('')
        : ''

      setNoteText(htmlText || note.text || '')
      setSummary(note.summary || '')
      setShareToken(note.shareToken || '')
      setIsShared(note.isShared || false)
      setFormData({
        callerName: note.callerName || '',
        callerEmail: note.callerEmail || '',
        callerLocation: note.callerLocation || '',
        callerAddress: note.callerAddress || '',
        callReason: note.callReason || '',
        folder: note.folder || 'General',
      })

      // Convert existing text to segments for display
      const textSegments: Segment[] = note.text
        ? note.text
          .split('\n')
          .filter(line => line.trim())
          .map((line, i) => ({
            id: `segment-${i}`,
            content: line.trim(),
            speaker: 'mic' as const,
            volume: 1,
            timestamp: i * 2,
            isFinal: true,
          }))
        : []
      setLiveSegments(textSegments)

      // Load existing audio recordings
      const existingRecordings = note.audioUrls?.map((url, i) => ({
        id: `saved-${i}`,
        url
      })) || []
      setRecordings(existingRecordings)
      recorderRef.current?.setAudioUrls(note.audioUrls || [])
    } else if (open && !note) {
      // New note - reset everything
      setNoteText('')
      setSummary('')
      setShareToken('')
      setIsShared(false)
      setFormData({
        callerName: '',
        callerEmail: '',
        callerLocation: '',
        callerAddress: '',
        callReason: '',
        folder: 'General',
      })
      setLiveSegments([])
      setRecordings([])
    } else if (!open) {
      // Modal closed - clear live transcription state
      setLiveSegments([])
    }
  }, [open, note])

  const extractFields = useCallback((text: string) => {
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
  }, [])

  const handleTranscription = useCallback((text: string) => {
    setNoteText(text)
    extractFields(text)
  }, [extractFields])

  const handleLiveTranscription = useCallback((segments: Segment[]) => {
    const unique = segments.filter((seg, i, arr) => i === 0 || seg.content.trim().toLowerCase() !== arr[i - 1].content.trim().toLowerCase())
    const full = unique.map(s => s.content).join('\n')
    setNoteText(full)
    setLiveSegments(unique)
    extractFields(full)
  }, [extractFields])

  const handleEditorChange = (content: string) => {
    setNoteText(content)
    const plainText = content.replace(/<[^>]*>/g, '\n')
    extractFields(plainText)
  }

  const resetNote = useCallback(() => {
    if (note) {
      // Convert plain text to HTML for ReactQuill
      const htmlText = note.text
        ? note.text
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p>${line}</p>`)
          .join('')
        : ''

      setNoteText(htmlText || note.text || '')
      setSummary(note.summary || '')
      setShareToken(note.shareToken || '')
      setIsShared(note.isShared || false)
      setFormData({
        callerName: note.callerName || '',
        callerEmail: note.callerEmail || '',
        callerLocation: note.callerLocation || '',
        callerAddress: note.callerAddress || '',
        callReason: note.callReason || '',
        folder: note.folder || 'General',
      })

      // Restore transcription segments
      const textSegments: Segment[] = note.text
        ? note.text
          .split('\n')
          .filter(line => line.trim())
          .map((line, i) => ({
            id: `segment-${i}`,
            content: line.trim(),
            speaker: 'mic' as const,
            volume: 1,
            timestamp: i * 2,
            isFinal: true,
          }))
        : []
      setLiveSegments(textSegments)

      // Restore recordings
      const existingRecordings = note.audioUrls?.map((url, i) => ({
        id: `saved-${i}`,
        url
      })) || []
      setRecordings(existingRecordings)
      recorderRef.current?.setAudioUrls(note.audioUrls || [])
      recorderRef.current?.resetRecordings()
    }
  }, [note])

  const handleSummarize = async () => {
    if (!noteText) return
    setIsSummarizing(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText.replace(/<[^>]*>/g, '\n') }),
      })
      const data = await res.json()
      if (data.summary) {
        setSummary(data.summary)
        toast({ title: 'Summary Generated', description: 'AI summary has been created.' })
      } else {
        throw new Error(data.error || 'Failed to summarize')
      }
    } catch (error) {
      toast({ title: 'Summarization Failed', description: 'Could not generate summary.', variant: 'destructive' })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleShare = async () => {
    if (!note) return
    setIsSharing(true)
    try {
      const res = await fetch(`/api/notes/${note.id}/share`, { method: 'POST' })
      const data = await res.json()
      if (data.shareToken) {
        setShareToken(data.shareToken)
        setIsShared(true)
        toast({ title: 'Note Shared', description: 'Public link generated.' })
      }
    } catch (error) {
      toast({ title: 'Share Failed', description: 'Could not share note.', variant: 'destructive' })
    } finally {
      setIsSharing(false)
    }
  }

  const handleStopSharing = async () => {
    if (!note) return
    setIsSharing(true)
    try {
      await fetch(`/api/notes/${note.id}/share`, { method: 'DELETE' })
      setShareToken('')
      setIsShared(false)
      toast({ title: 'Sharing Stopped', description: 'Public link revoked.' })
    } catch (error) {
      toast({ title: 'Action Failed', description: 'Could not stop sharing.', variant: 'destructive' })
    } finally {
      setIsSharing(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (!noteText.trim()) return
    setIsSaving(true)
    try {
      const isLive = transcriptionMode === 'live' && whisperlive?.enabled
      const recs = isLive ? await liveRef.current!.uploadRecordings() : await recorderRef.current!.uploadRecordings()

      const audioUrls = await Promise.all(
        (recs as Array<{ blob?: Blob; url?: string }>).map(async rec => {
          if (rec.blob) {
            const fd = new FormData()
            fd.append('file', rec.blob, `${Date.now()}-blob.wav`)
            const resp = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error('Upload failed')
            const { url } = await resp.json()
            return url
          }
          return rec.url as string
        })
      )

      const recordingObjs = audioUrls.map((url, i) => ({ id: `saved-${Date.now()}-${i}`, url }))
      setRecordings(prev => [...prev, ...recordingObjs])

      const payload = {
        text: noteText,
        audioUrls,
        ...formData,
        summary,
        shareToken,
        isShared
      }
      const url = note ? `/api/notes/${note.id}` : '/api/notes'
      const method = note ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to save')

      toast({ title: note ? 'Note Updated' : 'Note Saved', description: 'Saved successfully.' })
      recorderRef.current?.resetRecordings()
      onSave()
      onClose()
    } catch {
      toast({ title: 'Save Failed', description: 'Failed to save note.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }, [noteText, transcriptionMode, whisperlive?.enabled, formData, note, onSave, onClose, toast, summary, shareToken, isShared])

  const shareUrl = typeof window !== 'undefined' && shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : ''

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6 flex-1 overflow-auto">
          <div className="flex-1 space-y-4">
            {transcriptionMode === 'live' && whisperlive?.enabled ? (
              <>
                <TranscriptSegmentsDisplay segments={liveSegments} />
                {savedRecs.length > 0 && (
                  <RecordingsList recordings={recordings} onDelete={rec => setRecordings(prev => prev.filter(r => r.id !== rec.id))} />
                )}
                <WhisperLiveRecorder ref={liveRef} onSegments={handleLiveTranscription} />
              </>
            ) : (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1 min-h-[300px] bg-white rounded-md border border-input">
                  <ReactQuill
                    theme="snow"
                    value={noteText}
                    onChange={handleEditorChange}
                    className="h-full"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
                <NoteRecorder ref={recorderRef} audioUrls={note?.audioUrls} onTranscription={handleTranscription} />
              </div>
            )}
          </div>
          {/* Right: Form */}
          <div className="w-1/3 space-y-4 overflow-y-auto pr-2">

            {/* AI Actions */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
              <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Actions
              </h3>
              <Button
                onClick={handleSummarize}
                disabled={isSummarizing || !noteText}
                variant="secondary"
                className="w-full bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
              </Button>
              {summary && (
                <div className="mt-2">
                  <Label className="text-xs text-blue-700">Summary</Label>
                  <Textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="min-h-[100px] text-sm bg-white/50 border-blue-200 focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            {/* Sharing */}
            {note && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Sharing
                </h3>
                {!isShared ? (
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    variant="outline"
                    className="w-full"
                  >
                    {isSharing ? 'Generating Link...' : 'Create Public Link'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={shareUrl} readOnly className="bg-white text-xs" />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                          toast({ title: 'Copied', description: 'Link copied to clipboard' })
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(shareUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleStopSharing}
                      disabled={isSharing}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Stop Sharing
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="callerName">Caller Name *</Label>
                <Input id="callerName" value={formData.callerName} onChange={e => setFormData(prev => ({ ...prev, callerName: e.target.value }))} placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="callerEmail">Caller Email *</Label>
                <Input id="callerEmail" type="email" value={formData.callerEmail} onChange={e => setFormData(prev => ({ ...prev, callerEmail: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div>
                <Label htmlFor="callerLocation">Caller Location *</Label>
                <Input id="callerLocation" value={formData.callerLocation} onChange={e => setFormData(prev => ({ ...prev, callerLocation: e.target.value }))} placeholder="New York, NY" />
              </div>
              <div>
                <Label htmlFor="callerAddress">Caller Address *</Label>
                <Input id="callerAddress" value={formData.callerAddress} onChange={e => setFormData(prev => ({ ...prev, callerAddress: e.target.value }))} placeholder="123 Main St, Apt 4B" />
              </div>
              <div>
                <Label htmlFor="callReason">Reason for Call *</Label>
                <Textarea id="callReason" value={formData.callReason} onChange={e => setFormData(prev => ({ ...prev, callReason: e.target.value }))} placeholder="Project kick-off" />
              </div>
              <div>
                <Label htmlFor="folder">Folder</Label>
                <Select value={formData.folder} onValueChange={val => setFormData(prev => ({ ...prev, folder: val }))}>
                  <SelectTrigger className="w-full bg-white text-slate-900 border-slate-200">
                    <SelectValue placeholder="Select Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...folders, formData.folder].filter(Boolean))).map(f => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </Dialog>
  )
}
