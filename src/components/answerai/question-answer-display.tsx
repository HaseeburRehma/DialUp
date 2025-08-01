'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mic, Speaker, Bot, Copy, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Question, Answer } from '@/types/answerai'

interface QuestionAnswerDisplayProps {
  questions: Question[]
  answers: Answer[]
  onGenerateAnswer: (question: Question) => void
  isGenerating: boolean
}

export function QuestionAnswerDisplay({
  questions,
  answers,
  onGenerateAnswer,
  isGenerating
}: QuestionAnswerDisplayProps) {
  const { toast } = useToast()

  // Deduplicate questions based on content and speaker
  const uniqueQuestions = useMemo(() => {
    const seen = new Set<string>()
    return questions.filter(question => {
      const key = `${question.content.trim()}-${question.speaker}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [questions])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'Answer copied to clipboard',
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  if (!uniqueQuestions.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No questions recorded yet. Start your interview session to see questions and AI-generated answers here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Questions & Answers ({uniqueQuestions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {uniqueQuestions.map((question, idx) => {
              const answer = answers.find(a => a.questionId === question.id)

              return (
                <div 
                  key={question.id || `question-${idx}-${question.content.slice(0, 20)}`} 
                  className="border-l-4 border-l-blue-200 pl-4"
                >
                  {/* Question */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {question.speaker === 'interviewer' ? (
                        <Speaker className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-green-500" />
                      )}
                      <Badge variant={question.speaker === 'interviewer' ? 'default' : 'secondary'}>
                        {question.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(question.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium bg-gray-50 p-3 rounded">
                      {question.content}
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="ml-6">
                    {answer ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-green-600" />
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            AI Answer
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {Math.round(answer.confidence * 100)}%
                          </span>
                          <div className="flex gap-1 ml-auto">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(answer.content)}
                              title="Copy answer"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onGenerateAnswer(question)}
                              disabled={isGenerating}
                              title="Regenerate answer"
                            >
                              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-green-800 whitespace-pre-wrap">
                          {answer.content}
                        </p>
                      </div>
                    ) : question.speaker === 'interviewer' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => onGenerateAnswer(question)}
                          disabled={isGenerating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 mr-1" />
                              Generate Answer
                            </>
                          )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Press Enter or click to get AI-powered answer
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}