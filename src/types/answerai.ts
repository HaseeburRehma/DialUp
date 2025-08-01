export interface Question {
  id: string
  content: string
  speaker: 'interviewer' | 'candidate'
  timestamp: number
  audioSegment?: string
}

export interface Answer {
  id: string
  questionId: string
  content: string
  confidence: number
  generatedAt: number
  isAiGenerated: boolean
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