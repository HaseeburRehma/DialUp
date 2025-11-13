// src/components/answerai/answerai-card.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Clock, Play, Pause, Users, Building } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AnswerAISession } from '@/types/answerai'

interface AnswerAICardProps {
  session: AnswerAISession
  onEdit: () => void
  onDelete: () => void
}

export function AnswerAICard({ session, onEdit, onDelete }: AnswerAICardProps) {
  const [showFullDetails, setShowFullDetails] = useState(false)

  const created = formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })
  const updated = formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border border-green-500/20'
      case 'paused': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      default: return 'bg-slate-700/50 text-slate-300 border border-slate-600'
    }
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <Card className="rounded-xl border border-slate-700 bg-slate-900 shadow-xl hover:shadow-2xl transition-all">
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 leading-tight">
              {session.sessionName}
            </h3>

            <Badge className={`${getStatusColor(session.status)} flex items-center gap-1`}>
              {session.status === 'active' && <Play className="w-3 h-3" />}
              {session.status === 'paused' && <Pause className="w-3 h-3" />}
              {session.status}
            </Badge>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-slate-300 hover:bg-slate-800 rounded-md"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-400 hover:bg-red-500/10 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Candidate & Position */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Users className="w-4 h-4 text-slate-400" />
            <span><strong>Candidate:</strong> {session.candidateName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Building className="w-4 h-4 text-slate-400" />
            <span>
              <strong>Position:</strong> {session.position} @ {session.company}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 text-sm mb-4">
          <div className="text-slate-300">
            <span className="text-slate-400 block">Questions</span>
            <span className="font-semibold text-white">{session.questions.length}</span>
          </div>

          <div className="text-slate-300">
            <span className="text-slate-400 block">Answers</span>
            <span className="font-semibold text-white">{session.answers.length}</span>
          </div>

          <div className="text-slate-300">
            <span className="text-slate-400 block">Duration</span>
            <span className="font-semibold text-white">{formatDuration(session.totalDuration)}</span>
          </div>
        </div>

        {/* "Details" Toggle */}
        {session.audioUrls.length > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="text-blue-400 px-0"
          >
            {showFullDetails ? 'Hide details' : 'Show details'}
          </Button>
        )}

        {/* Full Details Section */}
        {showFullDetails && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
            {session.interviewerName && (
              <p className="text-sm text-slate-300 mb-1">
                <strong>Interviewer:</strong> {session.interviewerName}
              </p>
            )}
            {session.candidateEmail && (
              <p className="text-sm text-slate-300 mb-1">
                <strong>Email:</strong> {session.candidateEmail}
              </p>
            )}
            <p className="text-sm text-slate-300">
              <strong>Audio Files:</strong> {session.audioUrls.length}
            </p>

            {/* Audio Clips */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {session.audioUrls.slice(0, 3).map((url, i) => (
                <audio
                  key={i}
                  src={url}
                  controls
                  className="h-10 w-56 rounded bg-slate-900"
                />
              ))}
              {session.audioUrls.length > 3 && (
                <div className="text-sm text-slate-500 self-center">
                  +{session.audioUrls.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center text-sm text-slate-500 mt-4">
          <Clock className="w-4 h-4 mr-2" />
          {session.updatedAt !== session.createdAt
            ? `Updated ${updated}`
            : `Created ${created}`}
        </div>
      </CardContent>
    </Card>
  )
}
