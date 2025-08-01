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
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{session.sessionName}</h3>
            <Badge className={getStatusColor(session.status)}>
              {session.status === 'active' && <Play className="w-3 h-3 mr-1" />}
              {session.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
              {session.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Candidate:</strong> {session.candidateName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Position:</strong> {session.position} at {session.company}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Questions:</strong> {session.questions.length}
            </div>
            <div className="text-sm">
              <strong>Answers:</strong> {session.answers.length}
            </div>
            <div className="text-sm">
              <strong>Duration:</strong> {formatDuration(session.totalDuration)}
            </div>
          </div>
        </div>

        {showFullDetails && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Session Details:</h4>
            {session.interviewerName && (
              <p className="text-sm mb-1">
                <strong>Interviewer:</strong> {session.interviewerName}
              </p>
            )}
            {session.candidateEmail && (
              <p className="text-sm mb-1">
                <strong>Email:</strong> {session.candidateEmail}
              </p>
            )}
            <p className="text-sm">
              <strong>Audio Files:</strong> {session.audioUrls.length} recordings
            </p>
          </div>
        )}

        {session.audioUrls.length > 0 && (
          <div className="mb-4">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="p-0 h-auto"
            >
              {showFullDetails ? 'Show less' : 'Show details'}
            </Button>
          </div>
        )}

        {session.audioUrls.length > 0 && showFullDetails && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {session.audioUrls.slice(0, 3).map((url, index) => (
              <audio
                key={index}
                src={url}
                controls
                className="w-60 shrink-0 h-10"
              />
            ))}
            {session.audioUrls.length > 3 && (
              <span className="text-sm text-muted-foreground self-center">
                +{session.audioUrls.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {session.updatedAt !== session.createdAt
              ? `Updated ${updated}`
              : `Created ${created}`
            }
          </span>
        </div>
      </CardContent>
    </Card> 
  )
}