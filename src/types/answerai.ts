export interface Question {
  id: string
  content: string
  speaker: 'interviewer' | 'candidate'
  timestamp: number
  confidence?: number
  metadata?: {
    detectionMethod?: string
    context?: string
    processingTime?: number
    [key: string]: any
  }
}

export interface Answer {
  id: string
  questionId: string
  content: string
  confidence: number
  generatedAt: number
  isAiGenerated: boolean
   metadata?: {
    detectionMethod?: string
    context?: string
    processingTime?: number
    [key: string]: any
  }
}

export interface AnswerAISession {
  id: string
  sessionName: string
  interviewerName: string
  candidateName: string
  candidateEmail: string
  position: string
  company: string
  questions: Question[]
  answers: Answer[]
  audioUrls: string[]
  status: 'active' | 'paused' | 'completed'
  createdAt: string
  updatedAt: string
  totalDuration: number
}

export interface AnswerAISegment {
  id: string
  content: string
  speaker: 'interviewer' | 'candidate'
  volume: number
  timestamp: number
  confidence: number
}