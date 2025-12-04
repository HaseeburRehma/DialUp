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
      <DialogContent className="max-w-6xl h-[100vh] md:h-[90vh] w-full md:w-[95vw] lg:w-full flex flex-col overflow-hidden p-3 md:p-6 gap-3 md:gap-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base md:text-lg lg:text-xl">{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:gap-6 flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col space-y-3 md:space-y-4 overflow-hidden">
            {transcriptionMode === 'live' && whisperlive?.enabled ? (
              <div className="flex-1 flex flex-col gap-3 overflow-auto">
                <TranscriptSegmentsDisplay segments={liveSegments} />
                {savedRecs.length > 0 && (
                  <RecordingsList recordings={recordings} onDelete={rec => setRecordings(prev => prev.filter(r => r.id !== rec.id))} />
                )}
                <WhisperLiveRecorder ref={liveRef} onSegments={handleLiveTranscription} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-hidden">
                <div className="flex-1 min-h-0 bg-white rounded-md border border-input overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={noteText}
                    onChange={handleEditorChange}
                    className="h-full"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
                <div className="flex-shrink-0">
                  <NoteRecorder ref={recorderRef} audioUrls={note?.audioUrls} onTranscription={handleTranscription} />
                </div>
              </div>
            )}
          </div>
          {/* Right: Form */}
          <div className="w-full lg:w-1/3 space-y-3 md:space-y-4 overflow-y-auto lg:pr-2 flex-shrink-0">

            {/* AI Actions */}
            <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2 md:space-y-3">
              <h3 className="text-xs md:text-sm font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> AI Actions
              </h3>
              <Button
                onClick={handleSummarize}
                disabled={isSummarizing || !noteText}
                variant="secondary"
                size="sm"
                className="w-full h-9 text-xs md:text-sm bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
              </Button>
              {summary && (
                <div className="mt-2 space-y-1">
                  <Label className="text-xs text-blue-700">Summary</Label>
                  <Textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="min-h-[70px] md:min-h-[100px] text-xs md:text-sm bg-white/50 border-blue-200 focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            {/* Sharing */}
            {note && (
              <div className="p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Sharing
                </h3>
                {!isShared ? (
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isSharing ? 'Generating Link...' : 'Create Public Link'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Input value={shareUrl} readOnly className="bg-white text-xs flex-1 min-w-0" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                          toast({ title: 'Copied', description: 'Link copied to clipboard' })
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8"
                        onClick={() => window.open(shareUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleStopSharing}
                      disabled={isSharing}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Stop Sharing
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 md:gap-3 p-3 md:p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="callerName" className="text-xs md:text-sm">Caller Name *</Label>
                <Input
                  id="callerName"
                  value={formData.callerName}
                  onChange={e => setFormData(prev => ({ ...prev, callerName: e.target.value }))}
                  placeholder="John Doe"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="callerEmail" className="text-xs md:text-sm">Caller Email *</Label>
                <Input
                  id="callerEmail"
                  type="email"
                  value={formData.callerEmail}
                  onChange={e => setFormData(prev => ({ ...prev, callerEmail: e.target.value }))}
                  placeholder="john@example.com"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="callerLocation" className="text-xs md:text-sm">Caller Location *</Label>
                <Input
                  id="callerLocation"
                  value={formData.callerLocation}
                  onChange={e => setFormData(prev => ({ ...prev, callerLocation: e.target.value }))}
                  placeholder="New York, NY"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="callerAddress" className="text-xs md:text-sm">Caller Address *</Label>
                <Input
                  id="callerAddress"
                  value={formData.callerAddress}
                  onChange={e => setFormData(prev => ({ ...prev, callerAddress: e.target.value }))}
                  placeholder="123 Main St, Apt 4B"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="callReason" className="text-xs md:text-sm">Reason for Call *</Label>
                <Textarea
                  id="callReason"
                  value={formData.callReason}
                  onChange={e => setFormData(prev => ({ ...prev, callReason: e.target.value }))}
                  placeholder="Project kick-off"
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <Label htmlFor="folder" className="text-xs md:text-sm">Folder</Label>
                <Select value={formData.folder} onValueChange={val => setFormData(prev => ({ ...prev, folder: val }))}>
                  <SelectTrigger className="w-full h-9 bg-white text-slate-900 border-slate-200 text-sm">
                    <SelectValue placeholder="Select Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...folders, formData.folder].filter(Boolean))).map(f => (
                      <SelectItem key={f} value={f} className="text-sm">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={resetNote}
            disabled={isSaving}
            className="w-full sm:w-auto h-9 text-sm"
            size="sm"
          >
            <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!noteText.trim() || isSaving}
            className="w-full sm:w-auto h-9 text-sm"
            size="sm"
          >
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            {note ? 'Save Changes' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
