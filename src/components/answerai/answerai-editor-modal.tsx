
// src/components/answerai/answerai-editor-modal.tsx
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AnswerAIRecorder, AnswerAIRecorderHandle } from './answerai-recorder'
import { QuestionAnswerDisplay } from './question-answer-display'
import { RecordingsList, Recording } from '@/components/notes/recordings-list'
import { CandidateProfile } from './candidate-profile'
import { Save, RotateCcw, Bot, Loader2, Award } from 'lucide-react'
import type { AnswerAISession, AnswerAISegment, Question, Answer, Scorecard } from '@/types/answerai'

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  createdAt: string
  updatedAt: string
}

interface AnswerAIEditorModalProps {
  open: boolean
  session?: AnswerAISession | null
  onClose: () => void
  onSave: () => void
  note?: Note | null

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
  
  const [transcript, setTranscript] = useState(session?.transcript || '')
  const [totalDuration, setTotalDuration] = useState(session?.totalDuration || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingScorecard, setIsGeneratingScorecard] = useState(false)
  const [scorecard, setScorecard] = useState<Scorecard | null>(session?.scorecard || null)

  const recorderRef = useRef<AnswerAIRecorderHandle>(null)
  const { toast } = useToast()
  const startTimeRef = useRef<number>(Date.now())

  const savedRecs: Recording[] = session?.audioUrls?.map((url: string, i: number) => ({
    id: `saved-${i}`,
    url
  })) ?? []


  useEffect(() => {
    if (open && session?.id) {
      setIsLoading(true)
      fetch(`/api/answerai/${session.id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(fullSession => {
          setFormData({
            sessionName: fullSession.sessionName || '',
            interviewerName: fullSession.interviewerName || '',
            candidateName: fullSession.candidateName || '',
            candidateEmail: fullSession.candidateEmail || '',
            position: fullSession.position || '',
            company: fullSession.company || '',
            status: fullSession.status || 'active',
          })
          setQuestions(fullSession.questions || [])
          setAnswers(fullSession.answers || [])
          setTranscript(fullSession.transcript || '')
          setTotalDuration(fullSession.totalDuration || 0)
          // Note: AnswerAIRecorder will handle the transcript once it mounts/updates
        })
        .catch(err => console.error('Failed to fetch full session:', err))
        .finally(() => setIsLoading(false))
    } else if (open && session) {
      // Fallback if no ID or just initialization
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
    } else if (open && !session) {
      // Reset for new session
      setQuestions([])
      setAnswers([])
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

 

  const handleQuestionDetected = useCallback((question: Question | null) => {
    if (!question) return; // early return if null

    setQuestions(prev => {
      const updated = [...prev, question]
      extractFieldsFromConversation(updated)
      return updated
    })

    toast({
      title: 'Question Detected',
      description: `"${question.content.substring(0, 50)}..."`,
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
    if (!question || !recorderRef.current) return;

    setIsGeneratingAnswer(true);
    try {
      await recorderRef.current.generateAnswer(question.content);
    } finally {
      setIsGeneratingAnswer(false);
    }
  }, []);
  const handleGenerateScorecard = async () => {
    if (questions.length === 0) {
      toast({ title: 'Insufficient Data', description: 'At least one question is needed to generate a scorecard.', variant: 'destructive' })
      return
    }

    setIsGeneratingScorecard(true)
    try {
      const res = await fetch('/api/answerai/generate-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers })
      })
      if (!res.ok) throw new Error('Failed to generate scorecard')
      const data = await res.json()
      setScorecard(data)
      toast({ title: '🎯 Scorecard Generated!', description: 'AI assessment is ready.' })
    } catch (err: any) {
      console.error('Scorecard error:', err)
      toast({ title: 'Error', description: 'Failed to generate scorecard. Please try again.', variant: 'destructive' })
    } finally {
      setIsGeneratingScorecard(false)
    }
  }

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
      // Check if recorder is busy to ensure we don't save incomplete data
      if (recorderRef.current?.isBusy) {
        toast({
          title: 'Please Wait',
          description: 'Recording/Upload in progress. Please stop recording and wait for completion.',
          variant: 'default'
        });
        setIsSaving(false);
        return;
      }

      // Upload new recordings and merge with existing ones
      // Note: usage of MediaRecorder in the hook now handles uploads automatically on stop.
      // We double check here to ensure we have URLs.
      const newRecordings = await recorderRef.current!.uploadRecordings()
      const newAudioUrls = await Promise.all(
        newRecordings.map(async (rec) => {
          // If we already have a URL (from auto-upload), use it
          if (rec.url) return rec.url;

          // Fallback: manually upload if only blob is present
          if (rec.blob) {
            const fd = new FormData()
            fd.append('file', rec.blob)
            const resp = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error('Upload failed')
            const { url } = await resp.json();
            return url;
          }
          return null
        })
      )

      // Filter nulls and merge
      const validNewUrls = newAudioUrls.filter(u => u !== null) as string[]
      const existingUrls = session?.audioUrls || []
      const mergedAudioUrls = Array.from(new Set([...existingUrls, ...validNewUrls]))

      // Construct transcript from segments if they exist, otherwise use existing transcript state
      let finalTranscript = transcript

      // Prepare payload
      const payload = {
        sessionId: session?.id,
        ...formData,
        questions,
        answers,
        audioUrls: mergedAudioUrls,
        transcript: finalTranscript,
        totalDuration,
        scorecard,
      }
      console.log(`[AnswerAI] Saving session with ${questions.length} questions and ${answers.length} answers...`, payload)

      // Save session
      const url = session ? `/api/answerai/${session.id}` : '/api/answerai'
      const method = session ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to save session')

      // Send email with transcript  
      if (formData.candidateEmail && finalTranscript.trim()) {
        try {
          await fetch('/api/send-automatic-transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: finalTranscript,
              sessionName: formData.sessionName,
              candidateName: formData.candidateName,
              candidateEmail: formData.candidateEmail,
              interviewerName: formData.interviewerName,
              position: formData.position,
              company: formData.company,
              callDuration: `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`,
              callDate: new Date().toLocaleString(),
              questionsCount: questions.length,
              answersCount: answers.length,
              isAnswerAI: true,
            }),
          })

          toast({
            title: 'Email Sent',
            description: `Interview summary sent to ${formData.candidateEmail}`,
          })
        } catch (emailError) {
          console.error('Failed to send email:', emailError)
          // Don't fail the save if email fails
        }
      }

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
      <DialogContent className="max-w-7xl h-[100vh] md:h-[95vh] w-full md:w-[95vw] lg:w-full flex flex-col overflow-hidden p-3 md:p-6 gap-3 md:gap-4 bg-white">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex justify-between items-center w-full pr-8 text-base md:text-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 md:w-5 md:h-5" />
              <span>{session ? 'Edit AnswerAI Session' : 'Create AnswerAI Session'}</span>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </div>
            {questions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScorecard}
                disabled={isGeneratingScorecard}
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              >
                {isGeneratingScorecard ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Award className="h-3 w-3 mr-2 text-emerald-600" />}
                Generate AI Scorecard
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:gap-6 flex-1 overflow-hidden">
          {/* Left: Recording & Q&A */}
          <div className="flex-1 flex flex-col space-y-3 md:space-y-4 overflow-auto">
            <AnswerAIRecorder
              ref={recorderRef}
              sessionId={session?.id}
            
              onQuestionDetected={handleQuestionDetected}
              onAnswerGenerated={handleAnswerGenerated}
              position={formData.position}
              company={formData.company}
              initialQuestions={questions}
              initialAnswers={answers}
              initialTranscript={transcript}
            />


            {savedRecs.length > 0 && (
              <RecordingsList
                recordings={savedRecs}
                onDelete={() => {/* Disable deletion of saved URLs */ }}
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
          <div className="w-full lg:w-1/3 space-y-3 md:space-y-4 overflow-auto flex-shrink-0">
            <div className="grid grid-cols-1 gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-lg border border-slate-200">
              <div>
                <Label htmlFor="sessionName" className="text-xs md:text-sm">Session Name *</Label>
                <Input
                  id="sessionName"
                  value={formData.sessionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionName: e.target.value }))}
                  placeholder="Senior Developer Interview"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="candidateName" className="text-xs md:text-sm">Candidate Name *</Label>
                <Input
                  id="candidateName"
                  value={formData.candidateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                  placeholder="John Doe"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="candidateEmail" className="text-xs md:text-sm">Candidate Email</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                  placeholder="john@example.com"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-xs md:text-sm">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Senior Frontend Developer"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-xs md:text-sm">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="TechCorp Inc."
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="interviewerName" className="text-xs md:text-sm">Interviewer Name</Label>
                <Input
                  id="interviewerName"
                  value={formData.interviewerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewerName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-xs md:text-sm">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full h-9 rounded-md border border-border bg-popover px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {scorecard && (
                <div className="pt-4 border-t border-slate-200 mt-4 overflow-hidden">
                  <CandidateProfile
                    name={formData.candidateName || 'Candidate'}
                    email={formData.candidateEmail || 'No email provided'}
                    scorecard={scorecard}
                  />
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs md:text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Questions:</span>
                    <span>{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Answers:</span>
                    <span>{answers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={resetSession}
            disabled={isSaving}
            className="w-full sm:w-auto h-9 text-sm"
            size="sm"
          >
            <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto h-9 text-sm"
            size="sm"
          >
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            {session ? 'Save Changes' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}