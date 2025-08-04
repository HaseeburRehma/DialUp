export interface QuestionDetectionOptions {
  includeContext?: boolean
  maxQuestions?: number
  filterDuplicates?: boolean
}

export interface DetectedQuestion {
  content: string
  confidence: number
  method: 'pattern' | 'nlp' | 'context'
  context?: string
  startIndex?: number
  endIndex?: number
}

export interface QuestionDetectorConfig {
  minConfidence: number
  minLength: number
  maxLength: number
  debounceMs: number
}

export class QuestionDetector {
  private config: QuestionDetectorConfig
  private questionPatterns: RegExp[]
  private contextPatterns: RegExp[]
  private stopWords: Set<string>

  constructor(config: QuestionDetectorConfig) {
    this.config = config
    this.initializePatterns()
    this.initializeStopWords()
  }

  private initializePatterns() {
    // Enhanced question detection patterns
    this.questionPatterns = [
      // Direct question words
      /\b(?:what|how|why|when|where|who|which|whose)\b[^.!?]*\?/gi,
      // Can/Could questions
      /\b(?:can|could|would|will|should|do|does|did|have|has|had|is|are|was|were)\b[^.!?]*\?/gi,
      // Tell me about...
      /\b(?:tell me about|explain|describe|walk me through)\b[^.!?]*[.?]/gi,
      // What's your experience with...
      /\b(?:what's your|what is your)\b[^.!?]*[.?]/gi,
      // Have you ever...
      /\b(?:have you ever|have you worked)\b[^.!?]*[.?]/gi,
      // Technical questions
      /\b(?:implement|design|optimize|debug|solve)\b[^.!?]*[.?]/gi,
      // Behavioral questions
      /\b(?:situation|challenge|conflict|difficult|problem)\b[^.!?]*[.?]/gi,
    ]

    // Context patterns for better detection
    this.contextPatterns = [
      /\b(?:interview|question|ask|answer)\b/gi,
      /\b(?:let's|now|next|moving on)\b/gi,
      /\b(?:technical|behavioral|coding)\b/gi,
    ]
  }

  private initializeStopWords() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over'
    ])
  }

  async detectQuestions(
    text: string, 
    options: QuestionDetectionOptions = {}
  ): Promise<DetectedQuestion[]> {
    const {
      includeContext = true,
      maxQuestions = 5,
      filterDuplicates = true
    } = options

    const questions: DetectedQuestion[] = []
    const processedTexts = new Set<string>()

    // Clean and prepare text
    const cleanText = this.preprocessText(text)
    if (cleanText.length < this.config.minLength) {
      return questions
    }

    // Method 1: Pattern-based detection
    const patternQuestions = this.detectByPatterns(cleanText)
    questions.push(...patternQuestions)

    // Method 2: Sentence boundary detection
    const sentenceQuestions = this.detectBySentenceStructure(cleanText)
    questions.push(...sentenceQuestions)

    // Method 3: Context-aware detection
    if (includeContext) {
      const contextQuestions = this.detectByContext(cleanText)
      questions.push(...contextQuestions)
    }

    // Filter and rank questions
    let filteredQuestions = questions
      .filter(q => 
        q.content.length >= this.config.minLength &&
        q.content.length <= this.config.maxLength &&
        q.confidence >= this.config.minConfidence
      )
      .sort((a, b) => b.confidence - a.confidence)

    // Remove duplicates if requested
    if (filterDuplicates) {
      filteredQuestions = filteredQuestions.filter(q => {
        const normalized = this.normalizeQuestion(q.content)
        if (processedTexts.has(normalized)) {
          return false
        }
        processedTexts.add(normalized)
        return true
      })
    }

    return filteredQuestions.slice(0, maxQuestions)
  }

  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[""'']/g, '"')
      .replace(/…/g, '...')
  }

  private detectByPatterns(text: string): DetectedQuestion[] {
    const questions: DetectedQuestion[] = []

    for (const pattern of this.questionPatterns) {
      const matches = Array.from(text.matchAll(pattern))
      
      for (const match of matches) {
        if (match[0] && match.index !== undefined) {
          const content = this.cleanQuestionContent(match[0])
          const confidence = this.calculatePatternConfidence(content, pattern)
          
          if (confidence >= this.config.minConfidence) {
            questions.push({
              content,
              confidence,
              method: 'pattern',
              startIndex: match.index,
              endIndex: match.index + match[0].length
            })
          }
        }
      }
    }

    return questions
  }

  private detectBySentenceStructure(text: string): DetectedQuestion[] {
    const questions: DetectedQuestion[] = []
    const sentences = this.splitIntoSentences(text)

    for (const sentence of sentences) {
      const confidence = this.calculateStructuralConfidence(sentence)
      
      if (confidence >= this.config.minConfidence) {
        questions.push({
          content: sentence.trim(),
          confidence,
          method: 'nlp'
        })
      }
    }

    return questions
  }

  private detectByContext(text: string): DetectedQuestion[] {
    const questions: DetectedQuestion[] = []
    const contextScore = this.calculateContextScore(text)
    
    if (contextScore > 0.5) {
      const sentences = this.splitIntoSentences(text)
      
      for (const sentence of sentences) {
        if (this.couldBeQuestion(sentence)) {
          const confidence = Math.min(0.9, contextScore * this.calculateStructuralConfidence(sentence))
          
          if (confidence >= this.config.minConfidence) {
            questions.push({
              content: sentence.trim(),
              confidence,
              method: 'context',
              context: text.substring(0, 100) + '...'
            })
          }
        }
      }
    }

    return questions
  }

  private calculatePatternConfidence(content: string, pattern: RegExp): number {
    let confidence = 0.8 // Base confidence for pattern match

    // Boost confidence for explicit question marks
    if (content.includes('?')) confidence += 0.15

    // Boost for question words at the start
    if (/^(what|how|why|when|where|who|which|can|could|would|will|should|do|does|did)/i.test(content)) {
      confidence += 0.1
    }

    // Reduce confidence for very short or very long questions
    if (content.length < 20) confidence -= 0.1
    if (content.length > 200) confidence -= 0.05

    // Boost for interview-specific terms
    if (/\b(experience|project|challenge|skill|technology|framework|algorithm)\b/i.test(content)) {
      confidence += 0.05
    }

    return Math.min(1.0, Math.max(0.0, confidence))
  }

  private calculateStructuralConfidence(sentence: string): number {
    let confidence = 0.3 // Base confidence

    // Check for question indicators
    if (sentence.includes('?')) confidence += 0.4
    if (/^(what|how|why|when|where|who|which)/i.test(sentence)) confidence += 0.3
    if (/^(can|could|would|will|should|do|does|did|have|has|had|is|are|was|were)/i.test(sentence)) confidence += 0.25
    
    // Check for imperative patterns (tell me, explain, describe)
    if (/^(tell me|explain|describe|walk me through|give me)/i.test(sentence)) confidence += 0.3

    // Word count considerations
    const wordCount = sentence.split(/\s+/).length
    if (wordCount >= 5 && wordCount <= 30) confidence += 0.1
    if (wordCount < 3 || wordCount > 50) confidence -= 0.2

    return Math.min(1.0, Math.max(0.0, confidence))
  }

  private calculateContextScore(text: string): number {
    let score = 0
    const lowerText = text.toLowerCase()

    for (const pattern of this.contextPatterns) {
      const matches = lowerText.match(pattern)
      if (matches) {
        score += matches.length * 0.1
      }
    }

    return Math.min(1.0, score)
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + (s.includes('?') ? '' : '?')) // Add question mark if missing
  }

  private couldBeQuestion(sentence: string): boolean {
    // Quick heuristic to filter potential questions
    const questionWords = /\b(what|how|why|when|where|who|which|can|could|would|will|should|do|does|did|tell|explain|describe)\b/i
    const hasQuestionStructure = questionWords.test(sentence)
    const isReasonableLength = sentence.length >= 10 && sentence.length <= 300
    
    return hasQuestionStructure && isReasonableLength
  }

  private cleanQuestionContent(content: string): string {
    return content
      .trim()
      .replace(/^[.,;:!]+/, '')
      .replace(/[.,;:!]+$/, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => !this.stopWords.has(word))
      .join(' ')
  }
}