'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { AnswerAIRecorder, AnswerAIRecorderHandle } from './answerai-recorder'
import { QuestionAnswerDisplay } from './question-answer-display'
import { RecordingsList, Recording } from '@/components/notes/recordings-list'
import { Save, RotateCcw, Bot } from 'lucide-react'
import type { AnswerAISession, AnswerAISegment, Question, Answer } from '@/types/answerai'

interface AnswerAIEditorModalProps {
  open: boolean
  session?: AnswerAISession | null
  onClose: () => void
  onSave: () => void
}

export function AnswerAIEditorModal({ open, session, onClose, onSave }: AnswerAIEditorModalProps) {
  const [formData, setFormData] = useState({
    sessionName: session?.sessionName || '',
    interviewerName: session?.interviewerName || '',
    candidateName: session?.candidateName || '',
    candidateEmail: session?.candidateEmail || '',
    position: session?.position || '',
    company: session?.company || '',
    status: session?.status || 'active' as const,
  })

  const [questions, setQuestions] = useState<Question[]>(session?.questions || [])
  const [answers, setAnswers] = useState<Answer[]>(session?.answers || [])
  const [segments, setSegments] = useState<AnswerAISegment[]>([])
  const [totalDuration, setTotalDuration] = useState(session?.totalDuration || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)

  const recorderRef = useRef<AnswerAIRecorderHandle>(null)
  const { toast } = useToast()
  const startTimeRef = useRef<number>(Date.now())

  const savedRecs: Recording[] = session?.audioUrls?.map((url: string, i: number) => ({
    id: `saved-${i}`,
    url
  })) ?? []

  useEffect(() => {
    if (open && session) {
      setFormData({
        sessionName: session.sessionName || '',
        interviewerName: session.interviewerName || '',
        candidateName: session.candidateName || '',
        candidateEmail: session.candidateEmail || '',
        position: session.position || '',
        company: session.company || '',
        status: session.status || 'active',
      })
      setQuestions(session.questions || [])
      setAnswers(session.answers || [])
      setTotalDuration(session.totalDuration || 0)
      setSegments([])
    } else if (open && !session) {
      // Reset for new session
      setQuestions([])
      setAnswers([])
      setSegments([])
      setTotalDuration(0)
      startTimeRef.current = Date.now()
    }
  }, [open, session])

  // Auto-extract fields from questions/answers
  const extractFieldsFromConversation = useCallback((newQuestions: Question[]) => {
    for (const question of newQuestions) {
      const content = question.content.toLowerCase()
      
      // Extract candidate name
      const nameMatch = content.match(/(?:my name is|i'm|i am)\s+([a-zA-Z\s]+)/i)
      if (nameMatch?.[1] && !formData.candidateName) {
        setFormData(prev => ({ ...prev, candidateName: nameMatch[1].trim() }))
      }
      
      // Extract position
      const positionMatch = content.match(/(?:applying for|position|role).*?(?:as|for)\s+([^.]+)/i)
      if (positionMatch?.[1] && !formData.position) {
        setFormData(prev => ({ ...prev, position: positionMatch[1].trim() }))
      }
      
      // Extract company
      const companyMatch = content.match(/(?:at|with|for)\s+([A-Z][a-zA-Z\s]+)(?:\s|$|\.)/i)
      if (companyMatch?.[1] && !formData.company && companyMatch[1].length < 30) {
        setFormData(prev => ({ ...prev, company: companyMatch[1].trim() }))
      }
    }
  }, [formData])

  const handleSegments = useCallback((newSegments: AnswerAISegment[]) => {
    setSegments(newSegments)
    // Update duration based on segments
    if (newSegments.length > 0) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setTotalDuration(duration)
    }
  }, [])

  const handleQuestionDetected = useCallback((question: Question) => {
    setQuestions(prev => {
      const updated = [...prev, question]
      extractFieldsFromConversation(updated)
      return updated
    })
    
    toast({
      title: 'Question Detected',
      description: `"${question.content.substring(0, 50)}..."`,
      duration: 2000,
    })
  }, [extractFieldsFromConversation, toast])

  const handleAnswerGenerated = useCallback((answer: Answer) => {
    setAnswers(prev => [...prev, answer])
    toast({
      title: 'Answer Generated',
      description: 'AI response is ready!',
    })
  }, [toast])

  const handleGenerateAnswer = useCallback(async (question: Question) => {

    if (!recorderRef.current) return
    
    setIsGeneratingAnswer(true)
    try {
        await recorderRef.current?.generateAnswer(question)

    } finally {
      setIsGeneratingAnswer(false)
    }
  }, [])

  const resetSession = () => {
    setFormData({
      sessionName: session?.sessionName || '',
      interviewerName: session?.interviewerName || '',
      candidateName: session?.candidateName || '',
      candidateEmail: session?.candidateEmail || '',
      position: session?.position || '',
      company: session?.company || '',
      status: session?.status || 'active',
    })
    setQuestions(session?.questions || [])
    setAnswers(session?.answers || [])
    setSegments([])
    setTotalDuration(session?.totalDuration || 0)
    recorderRef.current?.resetRecordings()
  }

  const handleSave = async () => {
    if (!formData.sessionName.trim() || !formData.candidateName.trim() || 
        !formData.position.trim() || !formData.company.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in session name, candidate name, position, and company.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      // Upload recordings
      const recordings = await recorderRef.current!.uploadRecordings()
      const audioUrls = await Promise.all(
        recordings.map(async (rec) => {
          if (rec.blob) {
            const fd = new FormData()
            fd.append('file', rec.blob)
            const resp = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error('Upload failed')
            const { url } = await resp.json()
            return url
          }
          return rec.url
        })
      )

      // Prepare payload
      const payload = {
        ...formData,
        questions,
        answers,
        audioUrls,
        totalDuration,
      }

      // Save session
      const url = session ? `/api/answerai/${session.id}` : '/api/answerai'
      const method = session ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to save session')

      toast({
        title: session ? 'Session Updated' : 'Session Created',
        description: 'AnswerAI session saved successfully.',
      })

      recorderRef.current?.resetRecordings()
      onSave()
      onClose()
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save AnswerAI session.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {session ? 'Edit AnswerAI Session' : 'Create AnswerAI Session'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-auto">
          {/* Left: Recording & Q&A */}
          <div className="flex-1 space-y-4 overflow-auto">
            <AnswerAIRecorder
              ref={recorderRef}
              sessionId={session?.id}
              onSegments={handleSegments}
              onQuestionDetected={handleQuestionDetected}
              onAnswerGenerated={handleAnswerGenerated}
              position={formData.position}
              company={formData.company}
            />

            {savedRecs.length > 0 && (
              <RecordingsList
                recordings={savedRecs}
                onDelete={() => {/* Disable deletion of saved URLs */}}
              />
            )}

            <QuestionAnswerDisplay
              questions={questions}
              answers={answers}
              onGenerateAnswer={handleGenerateAnswer}
              isGenerating={isGeneratingAnswer}
            />
          </div>

          {/* Right: Form */}
          <div className="w-1/3 space-y-4 overflow-auto">
            <div className="grid grid-cols-1 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="sessionName">Session Name *</Label>
                <Input
                  id="sessionName"
                  value={formData.sessionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionName: e.target.value }))}
                  placeholder="Senior Developer Interview"
                />
              </div>

              <div>
                <Label htmlFor="candidateName">Candidate Name *</Label>
                <Input
                  id="candidateName"
                  value={formData.candidateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="candidateEmail">Candidate Email</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Senior Frontend Developer"
                />
              </div>

              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="TechCorp Inc."
                />
              </div>

              <div>
                <Label htmlFor="interviewerName">Interviewer Name</Label>
                <Input
                  id="interviewerName"
                  value={formData.interviewerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewerName: e.target.value }))}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full rounded-md border border-border bg-popover px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm space-y-1">
                  <div><strong>Questions:</strong> {questions.length}</div>
                  <div><strong>Answers:</strong> {answers.length}</div>
                  <div><strong>Duration:</strong> {Math.floor(totalDuration / 60)}m {totalDuration % 60}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetSession} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {session ? 'Save Changes' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}