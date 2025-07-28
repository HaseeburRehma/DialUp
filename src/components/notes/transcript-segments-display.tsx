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
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Transcript will appear here…
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4 bg-muted rounded-lg h-64 overflow-auto">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-2">
          {seg.speaker === 'mic' ? (
            <Mic className="text-green-500 w-4 h-4" />
          ) : (
            <Speaker className="text-blue-500 w-4 h-4" />
          )}
          <span className="flex-1 text-sm">{seg.content}</span>
          <div className="h-2 w-16 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-current rounded"
              style={{ width: `${Math.min(100, seg.volume * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
