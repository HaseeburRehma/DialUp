
// src/components/notes/transcript-display.tsx
'use client'

import React, { useMemo } from 'react'
import { Mic, User, Clock, Speaker } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AnswerAISegment } from '@/types/answerai'

interface TranscriptDisplayProps {
  transcript?: string
  segments?: AnswerAISegment[]
  showSpeakerSeparation?: boolean
  agentLabel?: string
  interviewerLabel?: string
  className?: string
}

export function TranscriptDisplay({
  transcript = '',
  segments = [],
  showSpeakerSeparation = true,
  agentLabel = 'Candidate',
  interviewerLabel = 'Employer / Interviewer',
  className = ''
}: TranscriptDisplayProps) {

  // Process segments OR fallback to parsing transcript
  const processedSegments = useMemo(() => {
    if (segments.length > 0) {
      return segments.map((segment, index) => ({
        id: segment.id || `segment-${index}`,
        speaker: segment.speaker,
        content: segment.content.trim(),
        timestamp: new Date(segment.timestamp).toLocaleTimeString(),
        confidence: segment.confidence || 0.8,
        volume: segment.volume || 0.5
      }))
    }

    if (transcript) {
      const lines = transcript.split(/\r?\n/).filter(line => line.trim())
      return lines.map((line, index) => {
        const isQuestion = line.includes('?') ||
          /^(what|how|why|when|where|who|which|can|could|would|will|should|do|does|did|tell|explain|describe|walk me through)/i.test(line.trim())

        const isResponse = /^(yes|no|well|so|i think|i believe|my experience|i have|i've worked)/i.test(line.trim())

        let speaker: 'interviewer' | 'candidate' = 'candidate'
        if (isQuestion) speaker = 'interviewer'
        else if (isResponse) speaker = 'candidate'

        return {
          id: `line-${index}`,
          speaker,
          content: line.trim(),
          timestamp: new Date().toLocaleTimeString(),
          confidence: 0.7,
          volume: 0.5
        }
      })
    }

    return []
  }, [segments, transcript])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now'
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Just now'
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return 'Just now'
    }
  }

  const getSpeakerIcon = (speaker: string) => {
    const s = speaker.toLowerCase()
    switch (s) {
      case 'interviewer':
      case 'caller':
      case 'system':
        return <Speaker className="text-sky-600 w-4 h-4 shrink-0" />
      case 'candidate':
      case 'agent':
      case 'mic':
      case 'user':
        return <Mic className="text-emerald-600 w-4 h-4 shrink-0" />
      default:
        return <User className="text-slate-600 w-4 h-4 shrink-0" />
    }
  }

  const getSpeakerStyle = (speaker: string) => {
    const s = speaker.toLowerCase()
    switch (s) {
      case 'interviewer':
      case 'caller':
      case 'system':
        return {
          container: 'bg-sky-50/50 border-l-4 border-sky-400 backdrop-blur-sm',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
          text: 'text-sky-950 font-medium'
        }
      case 'candidate':
      case 'agent':
      case 'mic':
      case 'user':
        return {
          container: 'bg-emerald-50/50 border-l-4 border-emerald-400 backdrop-blur-sm',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          text: 'text-emerald-950 font-medium'
        }
      default:
        return {
          container: 'bg-slate-50 border-l-4 border-slate-300',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          text: 'text-slate-900'
        }
    }
  }

  const getSpeakerLabel = (speaker: string) => {
    const s = speaker.toLowerCase()
    switch (s) {
      case 'interviewer':
      case 'caller':
        return interviewerLabel
      case 'system':
        return 'System'
      case 'candidate':
      case 'agent':
      case 'mic':
        return agentLabel
      case 'user':
        return 'You'
      default:
        return speaker.charAt(0).toUpperCase() + speaker.slice(1)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-muted rounded-lg min-h-[400px] max-h-[600px] overflow-auto border border-border shadow-inner">
      {processedSegments.length > 0 ? (
        <div className="space-y-2">
          {processedSegments.map((segment) => {
            const style = getSpeakerStyle(segment.speaker)
            return (
              <div key={segment.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:shadow-sm ${style.container}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {getSpeakerIcon(segment.speaker)}
                  {showSpeakerSeparation && (
                    <Badge variant="outline" className={`text-xs ${style.badge}`}>
                      {getSpeakerLabel(segment.speaker)}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${style.text}`}>
                    {segment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatTime(segment.timestamp)}</span>
                    </div>
                    {segment.confidence && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(segment.confidence * 100)}% confidence
                      </span>
                    )}
                    {segment.volume > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-current rounded opacity-60"
                            style={{ width: `${Math.min(100, segment.volume * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mic className="w-6 h-6 opacity-50" />
              <User className="w-6 h-6 opacity-50" />
              <Speaker className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">Live Transcript with Speaker Separation</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Start recording to see real-time transcription with automatic speaker identification
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Interviewer</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Candidate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>System Audio</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
