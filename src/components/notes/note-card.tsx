'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface NoteCardProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [showFullText, setShowFullText] = useState(false)
  const shouldShowExpandBtn = note.text.length > 300

  const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
  const updated = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{note.callReason}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-white/70 hover:text-blue-300 hover:bg-blue-500/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-white/70 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <p className={`text-white/90 leading-relaxed ${!showFullText && shouldShowExpandBtn ? 'line-clamp-3' : ''}`}>
            {note.text}
          </p>
          
          {shouldShowExpandBtn && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullText(!showFullText)}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
            >
              {showFullText ? 'Show less' : 'Show more'}
            </Button>
          )}

          {note.audioUrls && note.audioUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white/80">Audio Records</h4>
              <div className="grid gap-2">
                {note.audioUrls.map((url, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                    <audio
                      src={url}
                      controls
                      className="w-full h-10"
                      style={{
                        filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center text-sm text-white/60 pt-2 border-t border-white/10">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {note.updatedAt !== note.createdAt
                ? `Updated ${updated}`
                : `Created ${created}`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}