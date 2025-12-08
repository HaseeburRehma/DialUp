
// src/components/notes/transcript-segments-display.tsx
'use client'
import React from 'react'
import { Mic, Speaker } from 'lucide-react'
import type { Segment } from '@/types/transcription'

interface TranscriptSegmentsDisplayProps {
  segments: Segment[]
}

export function TranscriptSegmentsDisplay({ segments }: TranscriptSegmentsDisplayProps) {
  if (!segments.length) {
    return (
      <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground text-xs md:text-sm p-4">
        Transcript will appear here…
      </div>
    )
  }

  return (
    <div className="space-y-2 p-3 md:p-4 bg-muted rounded-lg h-48 md:h-64 overflow-auto">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-2">
          {seg.speaker === 'mic' ? (
            <Mic className="text-green-500 w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          ) : (
            <Speaker className="text-blue-500 w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          )}
          <span className="flex-1 text-xs md:text-sm break-words">{seg.content}</span>
          <div className="h-2 w-12 md:w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-current rounded"
              style={{ width: `${Math.min(100, (seg.volume ?? 0.5) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
