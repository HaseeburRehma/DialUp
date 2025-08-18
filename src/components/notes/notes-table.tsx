'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  MapPin, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Volume2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface NotesTableProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

interface AudioPlayerProps {
  src: string
  index: number
}

function AudioPlayer({ src, index }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handlePlayPause = (audioElement: HTMLAudioElement) => {
    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4 text-blue-400" />
        <span className="text-xs text-white/60">Audio {index + 1}</span>
      </div>
      <audio
        src={src}
        controls
        className="flex-1 h-8"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)',
          borderRadius: '8px'
        }}
      />
    </div>
  )
}

export function NotesTable({ notes, onEdit, onDelete }: NotesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFullText, setShowFullText] = useState<Set<string>>(new Set())

  const toggleRow = (noteId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleFullText = (noteId: string) => {
    const newShowFull = new Set(showFullText)
    if (newShowFull.has(noteId)) {
      newShowFull.delete(noteId)
    } else {
      newShowFull.add(noteId)
    }
    setShowFullText(newShowFull)
  }

  const truncateText = (text: string, limit: number = 150) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const isExpanded = expandedRows.has(note.id)
        const showFull = showFullText.has(note.id)
        const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
        const updated = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
        const shouldShowExpandText = note.text.length > 150

        return (
          <Card key={note.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <CardContent className="p-0">
              {/* Main Row */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(note.id)}
                      className="text-white/70 hover:text-white p-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{note.callReason}</h3>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          {note.updatedAt !== note.createdAt ? `Updated ${updated}` : `Created ${created}`}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-white/70">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{note.callerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{note.callerEmail}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{note.callerLocation}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-white/90 leading-relaxed">
                          {showFull || !shouldShowExpandText ? note.text : truncateText(note.text)}
                        </p>
                        {shouldShowExpandText && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleFullText(note.id)}
                            className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-2"
                          >
                            {showFull ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {note.audioUrls && note.audioUrls.length > 0 && (
                      <Badge variant="outline" className="border-teal-500/50 text-teal-300">
                        <Volume2 className="h-3 w-3 mr-1" />
                        {note.audioUrls.length} Audio{note.audioUrls.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(note)}
                      className="text-white/70 hover:text-blue-300 hover:bg-blue-500/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(note.id)}
                      className="text-white/70 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-white/20 bg-white/5">
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Contact Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Contact Details</h4>
                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{note.callerName}</p>
                              <p className="text-xs text-white/60">Caller Name</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{note.callerEmail}</p>
                              <p className="text-xs text-white/60">Email Address</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-orange-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{note.callerLocation}</p>
                              <p className="text-xs text-white/60">Location</p>
                            </div>
                          </div>
                          {note.callerAddress && (
                            <div className="pt-2 border-t border-white/10">
                              <p className="text-sm text-white/80">{note.callerAddress}</p>
                              <p className="text-xs text-white/60">Full Address</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Audio Files */}
                      {note.audioUrls && note.audioUrls.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Audio Records</h4>
                          <div className="space-y-3">
                            {note.audioUrls.map((url, index) => (
                              <AudioPlayer key={index} src={url} index={index} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}