'use client'

import React from 'react'
import { Mic, User, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TranscriptDisplayProps {
  transcript: string
}

interface TranscriptLine {
  speaker: 'interviewer' | 'candidate'
  content: string
  timestamp?: string
}

export function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  // Parse transcript into lines and identify speakers
  const parseTranscript = (text: string): TranscriptLine[] => {
    if (!text) return []
    
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    const parsedLines: TranscriptLine[] = []
    
    lines.forEach((line, index) => {
      // Simple heuristic: assume alternating speakers or detect question patterns
      const isQuestion = line.includes('?') || 
                        /^(what|how|why|when|where|who|which|can|could|would|will|should|do|does|did|tell|explain|describe)/i.test(line.trim())
      
      const speaker: 'interviewer' | 'candidate' = isQuestion ? 'interviewer' : 'candidate'
      
      parsedLines.push({
        speaker,
        content: line.trim(),
        timestamp: new Date().toLocaleTimeString()
      })
    })
    
    return parsedLines
  }

  const transcriptLines = parseTranscript(transcript)

  return (
    <div className="space-y-1 p-4 bg-muted rounded-lg h-64 overflow-auto">
      {transcriptLines.length > 0 ? (
        <div className="space-y-3">
          {transcriptLines.map((line, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
              line.speaker === 'interviewer' 
                ? 'bg-blue-50 border-l-4 border-blue-400' 
                : 'bg-green-50 border-l-4 border-green-400'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                {line.speaker === 'interviewer' ? (
                  <>
                    <User className="text-blue-600 w-4 h-4 shrink-0" />
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                      
                    </Badge>
                  </>
                ) : (
                  <>
                    <Mic className="text-green-600 w-4 h-4 shrink-0" />
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                     
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${
                  line.speaker === 'interviewer' ? 'text-blue-900' : 'text-green-900'
                }`}>
                  {line.content}
                </p>
                {line.timestamp && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{line.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Transcript will appear here as you speak...</p>
            <p className="text-xs mt-1">Start recording to see live transcription with speaker identification</p>
          </div>
        </div>
      )}
    </div>
  )
}