'use client'

import React, {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Square, Loader2, Bot, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AudioVisualizer } from '@/components/notes/audio-visualizer'
import { RecordingsList, Recording } from '@/components/notes/recordings-list'
import { useWhisperLive } from '@/hooks/use-whisper-live'
import { useSettings } from '@/hooks/SettingsContext'
import type { AnswerAISegment, Question, Answer } from '@/types/answerai'

export interface AnswerAIRecorderHandle {
  uploadRecordings: () => Promise<Recording[]>
  resetRecordings: () => void
  isBusy: boolean
  generateAnswer: (questionId: string) => Promise<void>
}

interface AnswerAIRecorderProps {
  sessionId?: string
  onSegments: (segments: AnswerAISegment[]) => void
  onQuestionDetected: (question: Question) => void
  onAnswerGenerated: (answer: Answer) => void
  position?: string
  company?: string
}

export const AnswerAIRecorder = forwardRef<AnswerAIRecorderHandle, AnswerAIRecorderProps>(
  function AnswerAIRecorder(
    { sessionId, onSegments, onQuestionDetected, onAnswerGenerated, position, company },
    ref
  ) {
    const { toast } = useToast()
    const { settings } = useSettings()
    const { transcription } = settings

    const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
    
    // Enhanced refs for better question detection
    const processedSegmentsRef = useRef<Set<string>>(new Set())
    const lastCompleteQuestionRef = useRef<string>('')
    const questionDetectionTimeoutRef = useRef<NodeJS.Timeout>()
    const detectedQuestionsRef = useRef<Set<string>>(new Set())

    // WhisperLive configuration
    const config = {
      serverUrl: transcription.whisperlive.serverUrl,
      port: transcription.whisperlive.port,
      language: transcription.language,
      translate: transcription.whisperlive.translate,
      model: transcription.transcriptionModel,
      vad: transcription.whisperlive.vad,
      saveRecording: transcription.whisperlive.saveRecording,
      outputFilename: transcription.whisperlive.outputFilename,
      maxClients: transcription.whisperlive.maxClients,
      maxConnectionTime: transcription.whisperlive.maxConnectionTime,
      audioSources: {
        microphone: true,
        systemAudio: true,
      },
    }

    const {
      state: whisperState,
      connect,
      disconnect,
      startTranscription,
      stopTranscription,
      clearTranscript,
      audioData,
      dataUpdateTrigger,
      recordings,
      deleteRecording,
      resetRecordings,
    } = useWhisperLive(config)

    // Helper function to detect if text is a question
    const isQuestionText = (text: string): boolean => {
      const trimmed = text.trim().toLowerCase()
      
      // Must be long enough to be meaningful
      if (trimmed.length < 10) return false
      
      // Question patterns
      const questionPatterns = [
        /\?$/, // Ends with question mark
        /^(what|how|when|where|why|who|which|can you|could you|would you|do you|have you|are you|will you|did you)/,
        /^(tell me|explain|describe|walk me through|give me an example)/,
        /^(let's talk about|let me ask you|i'd like to know)/
      ]
      
      return questionPatterns.some(pattern => pattern.test(trimmed))
    }

    // Convert segments with deduplication
    const convertToAnswerAISegments = useCallback((segments: any[]): AnswerAISegment[] => {
      const newSegments: AnswerAISegment[] = []
      
      segments.forEach((seg, index) => {
        const segmentId = `${seg.content}-${seg.speaker}-${index}`
        
        // Skip if already processed
        if (processedSegmentsRef.current.has(segmentId)) {
          return
        }
        
        processedSegmentsRef.current.add(segmentId)
        
        const answerAISegment: AnswerAISegment = {
          id: `segment-${Date.now()}-${index}`,
          content: seg.content,
          speaker: seg.speaker === 'mic' ? 'candidate' : 'interviewer',
          volume: seg.volume || 0.5,
          timestamp: Date.now() + index * 1000,
          confidence: 0.8,
        }
        
        newSegments.push(answerAISegment)
      })
      
      return newSegments
    }, [])

    // Enhanced question detection
    const detectQuestionsFromSegments = useCallback((segments: AnswerAISegment[]) => {
      const interviewerSegments = segments.filter(s => s.speaker === 'interviewer')
      
      if (interviewerSegments.length === 0) return
      
      // Combine recent interviewer segments to form complete thoughts
      const recentSegments = interviewerSegments.slice(-3) // Last 3 segments
      const combinedText = recentSegments.map(s => s.content).join(' ').trim()
      
      // Check if this forms a complete question
      if (isQuestionText(combinedText) && 
          combinedText !== lastCompleteQuestionRef.current &&
          !detectedQuestionsRef.current.has(combinedText)) {
        
        // Clear any existing timeout
        if (questionDetectionTimeoutRef.current) {
          clearTimeout(questionDetectionTimeoutRef.current)
        }
        
        // Wait briefly to ensure question is complete
        questionDetectionTimeoutRef.current = setTimeout(() => {
          const question: Question = {
            id: `q-${Date.now()}`,
            content: combinedText,
            speaker: 'interviewer',
            timestamp: Date.now(),
          }
          
          // Mark as detected to prevent duplicates
          detectedQuestionsRef.current.add(combinedText)
          lastCompleteQuestionRef.current = combinedText
          
          setCurrentQuestion(question)
          onQuestionDetected(question)
          
          console.log('✅ New question detected:', question)
          
          toast({
            title: 'Question Detected!',
            description: 'Press Enter or click "Generate Answer" for AI response',
            duration: 3000,
          })
        }, 1500) // Reduced timeout for faster detection
      }
    }, [onQuestionDetected, toast])

    // Handle segments from WhisperLive
    useEffect(() => {
      if (whisperState.segments.length > 0) {
        const answerAISegments = convertToAnswerAISegments(whisperState.segments)
        
        if (answerAISegments.length > 0) {
          onSegments(answerAISegments)
          detectQuestionsFromSegments(answerAISegments)
        }
      }
    }, [whisperState.segments, onSegments, convertToAnswerAISegments, detectQuestionsFromSegments])

    // Generate AI answer
    const generateAnswer = useCallback(async (questionId: string | Question) => {
      const question = typeof questionId === 'string' 
        ? currentQuestion 
        : questionId as Question
        
      if (!question?.content?.trim()) {
        toast({
          title: 'Error',
          description: 'Question content is missing',
          variant: 'destructive',
        })
        return
      }

      setIsGeneratingAnswer(true)
      try {
        const response = await fetch('/api/answerai/generate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.content,
            position,
            company,
            context: whisperState.transcript,
          }),
        })

        if (!response.ok) throw new Error('Failed to generate answer')

        const { answer, confidence, generatedAt, isAiGenerated } = await response.json()

        const answerObj: Answer = {
          id: `a-${Date.now()}`,
          questionId: question.id,
          content: answer,
          confidence,
          generatedAt,
          isAiGenerated,
        }

        onAnswerGenerated(answerObj)

        toast({
          title: 'Answer Generated!',
          description: 'AI answer is ready.',
        })
      } catch (error) {
        console.error('Answer generation failed:', error)
        toast({
          title: 'Generation Failed',
          description: 'Could not generate answer. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsGeneratingAnswer(false)
      }
    }, [position, company, whisperState.transcript, onAnswerGenerated, toast, currentQuestion])

    // Handle Enter key for quick generation
    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && currentQuestion && !isGeneratingAnswer) {
          event.preventDefault()
          generateAnswer(currentQuestion)
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [currentQuestion, isGeneratingAnswer, generateAnswer])

    // Reset function to clear all detection state
    const resetDetectionState = useCallback(() => {
      processedSegmentsRef.current.clear()
      detectedQuestionsRef.current.clear()
      lastCompleteQuestionRef.current = ''
      setCurrentQuestion(null)
      
      if (questionDetectionTimeoutRef.current) {
        clearTimeout(questionDetectionTimeoutRef.current)
      }
    }, [])

    // Expose API
    useImperativeHandle(
      ref,
      () => ({
        uploadRecordings: async () => recordings,
        resetRecordings: () => {
          resetRecordings()
          resetDetectionState()
        },
        isBusy: whisperState.isTranscribing || isGeneratingAnswer,
        generateAnswer,
      }),
      [recordings, resetRecordings, whisperState.isTranscribing, isGeneratingAnswer, generateAnswer, resetDetectionState]
    )

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AnswerAI Interview Recorder
              <Badge variant={whisperState.isConnected ? 'default' : 'destructive'}>
                {whisperState.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => whisperState.isConnected ? disconnect() : connect()}
                variant={whisperState.isConnected ? 'destructive' : 'default'}
              >
                {whisperState.isConnected ? 'Disconnect' : 'Connect'}
              </Button>

              <Button
                onClick={() => {
                  if (!whisperState.isConnected) connect()
                  else if (whisperState.isTranscribing) stopTranscription()
                  else startTranscription()
                }}
                disabled={!whisperState.isConnected}
                variant={whisperState.isTranscribing ? 'destructive' : 'default'}
              >
                {whisperState.isTranscribing ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {currentQuestion && (
                <Button
                  onClick={() => generateAnswer(currentQuestion)}
                  disabled={isGeneratingAnswer}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGeneratingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Answer
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => {
                  clearTranscript()
                  resetRecordings()
                  resetDetectionState()
                }}
                variant="outline"
                disabled={!whisperState.segments.length}
              >
                Clear All
              </Button>
            </div>

            {whisperState.isTranscribing && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-700">
                  Recording interview... Questions will be auto-detected
                </span>
              </div>
            )}

            {currentQuestion && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Latest Question</Badge>
                  <span className="text-xs text-muted-foreground">
                    Press Enter for quick answer
                  </span>
                </div>
                <p className="text-sm font-medium">{currentQuestion.content}</p>
              </div>
            )}

            {audioData && (
              <AudioVisualizer
                audioData={audioData}
                dataUpdateTrigger={dataUpdateTrigger}
              />
            )}

            {recordings.length > 0 && (
              <RecordingsList
                recordings={recordings}
                onDelete={deleteRecording}
              />
            )}

            {whisperState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">
                  {whisperState.error}. Please check your server settings.
                </p>
              </div>
            )}

            {!whisperState.isTranscribing && !recordings.length && !whisperState.error && (
              <p className="text-center text-muted-foreground py-8">
                Connect and start recording to begin your AI-powered interview session.
                <br />
                <span className="text-sm">
                  💡 Questions will be auto-detected and can be answered instantly!
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
)

AnswerAIRecorder.displayName = 'AnswerAI Recorder'