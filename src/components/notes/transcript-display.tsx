'use client'

import { Mic, User } from 'lucide-react'

interface TranscriptDisplayProps {
  transcript: string
}

export function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const lines = transcript.split(/\r?\n/).filter(line => line.trim())

  return (
    <div className="space-y-1 p-4 bg-muted rounded-lg h-64 overflow-auto">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-2">
          <Mic className="text-green-500 w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm flex-1">{line}</p>
          <User className="text-blue-500 w-4 h-4 mt-0.5 shrink-0" />
        </div>
      ))}
      {lines.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Transcript will appear here...</p>
        </div>
      )}
    </div>
  )
}