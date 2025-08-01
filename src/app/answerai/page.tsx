'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Bot } from 'lucide-react'
import { AnswerAICard } from '@/components/answerai/answerai-card'
import { AnswerAIEditorModal } from '@/components/answerai/answerai-editor-modal'
import { AnswerAIDeleteModal } from '@/components/answerai/answerai-delete-modal'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useToast } from '@/hooks/use-toast'
import type { AnswerAISession } from '@/types/answerai'

export default function AnswerAIPage() {
  const [sessions, setSessions] = useState<AnswerAISession[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingSession, setEditingSession] = useState<AnswerAISession | null>(null)
  const [deletingSession, setDeletingSession] = useState<AnswerAISession | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/answerai', {
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/auth/signin')
        return
      }

      if (response.ok) {
        const data: AnswerAISession[] = await response.json()
        setSessions(data)
      } else {
        throw new Error('Failed to fetch sessions')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load AnswerAI sessions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleCreateSession = () => {
    setEditingSession(null)
    setShowEditor(true)
  }

  const handleEditSession = (session: AnswerAISession) => {
    setEditingSession(session)
    setShowEditor(true)
  }

  const handleDeleteSession = (session: AnswerAISession) => {
    setDeletingSession(session)
    setShowDeleteModal(true)
  }

  const handleSessionSaved = () => {
    setShowEditor(false)
    setEditingSession(null)
    fetchSessions()
  }

  const handleSessionDeleted = () => {
    setShowDeleteModal(false)
    setDeletingSession(null)
    fetchSessions()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading AnswerAI sessions...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            AnswerAI Sessions
          </h1>
          <p className="text-muted-foreground">
            AI-powered interview assistance with real-time question detection and answer generation
          </p>
        </div>
        <Button onClick={handleCreateSession}>
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No AnswerAI sessions created</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first AI-powered interview session to get started with intelligent question detection 
            and instant answer generation for tech interviews.
          </p>
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Auto-detects interviewer questions from system audio</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Generates AI-powered answers in nanoseconds</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Records candidate responses via microphone</span>
            </div>
          </div>
          <Button onClick={handleCreateSession}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Session
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <AnswerAICard
              key={session.id}
              session={session}
              onEdit={() => handleEditSession(session)}
              onDelete={() => handleDeleteSession(session)}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <AnswerAIEditorModal
          open={showEditor}
          session={editingSession}
          onClose={() => setShowEditor(false)}
          onSave={handleSessionSaved}
        />
      )}

      {showDeleteModal && deletingSession && (
        <AnswerAIDeleteModal
          session={deletingSession}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleSessionDeleted}
        />
      )}
    </DashboardLayout>
  )
}