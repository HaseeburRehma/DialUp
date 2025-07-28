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
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">{note.callReason}</h3>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <p className={`whitespace-pre-wrap ${!showFullText && shouldShowExpandBtn ? 'line-clamp-3' : ''}`}>
              {note.text}
            </p>
            {shouldShowExpandBtn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFullText(!showFullText)}
                className="p-0 h-auto"
              >
                {showFullText ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {note.audioUrls && note.audioUrls.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {note.audioUrls.map((url, index) => (
              <audio
                key={index}
                src={url}
                controls
                className="w-60 shrink-0 h-10"
              />
            ))}
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground gap-2 mt-4">
          <Clock className="w-4 h-4" />
          <span>
            {note.updatedAt !== note.createdAt
              ? `Updated ${updated}`
              : `Created ${created}`
            }
          </span>
        </div>
      </CardContent>
    </Card>
  )
}