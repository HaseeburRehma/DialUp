// src/app/answerai/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AnswerAICard } from '@/components/answerai/answerai-card'
import { AnswerAIEditorModal } from '@/components/answerai/answerai-editor-modal'
import { AnswerAIDeleteModal } from '@/components/answerai/answerai-delete-modal'
import { Button } from '@/components/ui/button'
import { Plus, Bot } from 'lucide-react'
import type { AnswerAISession } from '@/types/answerai'

export const dynamic = 'force-dynamic'

export default function AnswerAIPage() {
  useAuthRedirect('/api/answerai')

  const [sessions, setSessions] = useState<AnswerAISession[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingSession, setEditingSession] = useState<AnswerAISession | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingSession, setDeletingSession] = useState<AnswerAISession | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/answerai', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">AnswerAI Sessions</h1>
            </div>
            <p className="text-slate-600">
              AI-powered interview assistance with real-time question detection and answer generation
            </p>
          </div>
          <Button
            onClick={handleCreateSession}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">No AnswerAI sessions yet</h2>
              <p className="text-slate-600 mb-8">
                Create your first AI-powered interview session to get started with intelligent question detection
                and instant answer generation for tech interviews.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-slate-700 font-medium">Auto-detects interviewer questions</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-slate-700 font-medium">Generates AI-powered answers instantly</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-slate-700 font-medium">Records candidate responses</p>
                </div>
              </div>

              <Button
                onClick={handleCreateSession}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Session
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </DashboardLayout>
  )
}