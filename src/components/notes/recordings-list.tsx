'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Speaker, Trash2 } from 'lucide-react'

export interface Recording {
  id: string
  url: string
  blob?: Blob
}

interface RecordingsListProps {
  recordings: Recording[]
  onDelete: (recording: Recording) => void
}

export function RecordingsList({ recordings, onDelete }: RecordingsListProps) {
  if (!recordings.length) return null

  return (
    <ul className="space-y-2">
      {recordings.map(rec => (
        <li key={rec.id} className="flex items-center justify-between">
          <audio controls src={rec.url} className="flex-1 mr-2" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => new Audio(rec.url).play()}
              title="Play"
            >
              <Speaker className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(rec)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}