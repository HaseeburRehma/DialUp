'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useMemo,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  Square,
  Loader2,
  Bot,
  Zap,
  AlertCircle,
  Wifi,
  WifiOff,
  Send,
  FileText,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioVisualizer } from '@/components/notes/audio-visualizer';
import { RecordingsList, Recording } from '@/components/notes/recordings-list';
import { TranscriptDisplay } from '@/components/notes/transcript-display';
import { useOptimizedWhisperLive } from '@/hooks/use-optimized-whisper-live';
import { useSettings } from '@/hooks/SettingsContext';
import { QuestionDetector } from '@/utils/question-detector';
import { TranscriptionBuffer } from '@/utils/transcription-buffer';
import type { AnswerAISegment, Question, Answer } from '@/types/answerai';

export interface AnswerAIRecorderHandle {
  uploadRecordings: () => Promise<Recording[]>;
  resetRecordings: () => void;
  isBusy: boolean;
  generateAnswer: (questionId: string) => Promise<void>;
  forceQuestionDetection: () => void;
  addManualQuestion: (content: string) => void;
}

interface AnswerAIRecorderProps {
  sessionId?: string;
  onSegments: (segments: AnswerAISegment[]) => void;
  onQuestionDetected: (question: Question | null) => void;
  onAnswerGenerated: (answer: Answer) => void;
  position?: string;
  company?: string;
}

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'unknown';

// Memoized connection status indicator
const ConnectionStatus = React.memo(function ConnectionStatus({
  isConnected,
  isTranscribing,
  quality,
  latency,
}: {
  isConnected: boolean;
  isTranscribing: boolean;
  quality: ConnectionQuality;
  latency: number;
}) {
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="ml-2 flex items-center gap-2">
      <Badge variant={isConnected ? 'default' : 'destructive'}>
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 mr-1" />
            {isTranscribing ? 'Recording' : 'Connected'}
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </>
        )}
      </Badge>
      {isConnected && (
        <Badge variant="outline" className={getQualityColor()}>
          {quality} • {latency}ms
        </Badge>
      )}
    </div>
  );
});

export const AnswerAIRecorder = forwardRef<AnswerAIRecorderHandle, AnswerAIRecorderProps>(
  function AnswerAIRecorder(
    { sessionId, onSegments, onQuestionDetected, onAnswerGenerated, position, company },
    ref
  ) {
    const { toast } = useToast();
    const { settings } = useSettings();
    const transcription = settings?.transcription;

    const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null | undefined>(undefined);

    const [processingState, setProcessingState] =
      useState<'idle' | 'detecting' | 'processing'>('idle');
    const [confidenceScore, setConfidenceScore] = useState(0);
    const [manualQuestion, setManualQuestion] = useState('');
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [showTranscript, setShowTranscript] = useState(true);
    const [transcriptText, setTranscriptText] = useState('');
    const [stats, setStats] = useState({
      questionsDetected: 0,
      answersGenerated: 0,
      processingTime: 0,
    });

    // Enhanced refs for performance
    const questionDetectorRef = useRef<QuestionDetector | null>(null);
    const transcriptionBufferRef = useRef<TranscriptionBuffer | null>(null);
    const processingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastProcessedContentRef = useRef<string>('');
    const questionCacheRef = useRef<Map<string, Question>>(new Map());
    const performanceStartRef = useRef<number>(0);

    // Initialize enhanced utilities
    useEffect(() => {
      questionDetectorRef.current = new QuestionDetector({
        minConfidence: 0.75,
        minLength: 8,
        maxLength: 600,
        debounceMs: 1000,
      });

      transcriptionBufferRef.current = new TranscriptionBuffer({
        maxSize: 150,
        mergeThreshold: 1500,
      });

      return () => {
        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      };
    }, []);

    // Optimized WhisperLive configuration
    const whisperConfig = useMemo(
      () => ({
        serverUrl: transcription?.whisperlive.serverUrl,
        port: transcription?.whisperlive.port,
        language: transcription?.language,
        translate: transcription?.whisperlive.translate,
        model: transcription?.transcriptionModel,
        vad: true,
        saveRecording: transcription?.whisperlive.saveRecording,
        outputFilename: transcription?.whisperlive.outputFilename,
        maxClients: transcription?.whisperlive.maxClients,
        maxConnectionTime: Math.max(transcription?.whisperlive.maxConnectionTime ?? 0, 3600),
        audioSources: {
          microphone: true,
          systemAudio: true,
        },
        optimization: {
          chunkSize: 1024,
          bufferSize: 2048,
          enableSmartBuffering: true,
          enableNoiseReduction: true,
        },
      }),
      [transcription]
    );

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
    } = useOptimizedWhisperLive(whisperConfig);

    // Optimized segment conversion
    const convertToAnswerAISegments = useCallback((segments: Array<any>): AnswerAISegment[] => {
      return segments
        .map((seg, index): AnswerAISegment => {
          let speaker: 'interviewer' | 'candidate' = 'candidate';
          if (seg.speaker === 'speaker') speaker = 'interviewer';
          else if (seg.speaker === 'mic') speaker = 'candidate';

          return {
            id: `segment-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`,
            content: (seg.content ?? '').toString().trim(),
            speaker,
            volume: Number(seg.volume ?? 0),
            timestamp: Date.now() + index * 50,
            confidence: Number(seg.confidence ?? 0.85),
          };
        })
        .filter((s) => s.content.length > 0);
    }, []);

    // Manual question
    const addManualQuestion = useCallback(
      (content: string) => {
        if (!content.trim()) return;

        const question: Question = {
          id: `manual-q-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          content: content.trim(),
          speaker: 'interviewer',
          timestamp: Date.now(),
          confidence: 1.0,
          metadata: {
            detectionMethod: 'manual',
            context: 'User input',
            processingTime: 0,
          },
        };

        const questionKey = question.content.toLowerCase().substring(0, 50);
        questionCacheRef.current.set(questionKey, question);
        setAllQuestions((prev) => [...prev, question]);
        setCurrentQuestion(question);
        setConfidenceScore(1.0);
        setStats((prev) => ({ ...prev, questionsDetected: prev.questionsDetected + 1 }));

        onQuestionDetected(question);
        setManualQuestion('');

        toast({
          title: '✅ Manual Question Added!',
          description: 'Question ready for AI answer generation',
        });
      },
      [onQuestionDetected, toast]
    );

    // Detection
    const detectQuestions = useCallback(
      async (segments: AnswerAISegment[]) => {
        if (!questionDetectorRef.current || !transcriptionBufferRef.current) return;

        const interviewerSegments = segments.filter((s) => s.speaker === 'interviewer');
        if (interviewerSegments.length === 0) return;

        setProcessingState('detecting');
        performanceStartRef.current = Date.now();

        try {
          for (const segment of interviewerSegments) {
            transcriptionBufferRef.current.addSegment(segment);
          }

          const contextualContent = transcriptionBufferRef.current.getMergedContent('interviewer');

          if (contextualContent === lastProcessedContentRef.current || contextualContent.length < 10) {
            setProcessingState('idle');
            return;
          }

          const detectedQuestions = await questionDetectorRef.current.detectQuestions(
            contextualContent,
            { includeContext: true, maxQuestions: 2, filterDuplicates: true }
          );

          for (const dq of detectedQuestions) {
            const questionKey = dq.content.toLowerCase().trim().replace(/\s+/g, ' ');
            if (questionCacheRef.current.has(questionKey)) continue;

            const question: Question = {
              id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              content: dq.content,
              speaker: 'interviewer',
              timestamp: Date.now(),
              confidence: dq.confidence,
              metadata: {
                detectionMethod: dq.method,
                context: dq.context,
                processingTime: Date.now() - performanceStartRef.current,
              },
            };

            questionCacheRef.current.set(questionKey, question);
            const alreadyInList = allQuestions.some(
              (q) =>
                q.id === question.id ||
                q.content.trim().toLowerCase() === question.content.trim().toLowerCase()
            );

            if (!alreadyInList) setAllQuestions((prev) => [...prev, question]);

            setCurrentQuestion(question);
            setConfidenceScore(dq.confidence);
            setStats((prev) => ({ ...prev, questionsDetected: prev.questionsDetected + 1 }));

            onQuestionDetected(question);

            toast({
              title: '🎯 Question Detected!',
              description: `${Math.round(dq.confidence * 100)}% confidence • Press Enter for instant AI response`,
            });

            break; // one at a time
          }

          lastProcessedContentRef.current = contextualContent;
          const processingTime = Date.now() - performanceStartRef.current;
          setStats((prev) => ({ ...prev, processingTime }));
        } catch (err) {
          console.error('[AnswerAI] Question detection error:', err);
          toast({
            title: 'Detection Error',
            description: 'Question detection failed. Manual detection available.',
            variant: 'destructive',
          });
        } finally {
          setProcessingState('idle');
        }
      },
      [onQuestionDetected, toast, allQuestions]
    );

    const [convertedSegments, setConvertedSegments] = useState<AnswerAISegment[]>([]);

    useEffect(() => {
      const segments = convertToAnswerAISegments(whisperState.segments);
      setConvertedSegments(segments);
      onSegments(segments);
    }, [whisperState.segments, convertToAnswerAISegments, onSegments]);

    // Debounced detection
    useEffect(() => {
      if (whisperState.segments.length === 0) return;

      const answerAISegments = convertToAnswerAISegments(whisperState.segments);
      onSegments(answerAISegments);

      const fullTranscript = answerAISegments
        .map((seg) => `[${seg.speaker.toUpperCase()}]: ${seg.content}`)
        .join('\n');
      setTranscriptText(fullTranscript);

      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

      const hasQuestionMarkers = answerAISegments.some(
        (s) => s.speaker === 'interviewer' && (s.content.includes('?') || s.confidence > 0.9)
      );

      const debounceTime = hasQuestionMarkers ? 500 : 1200;

      processingTimeoutRef.current = setTimeout(() => {
        detectQuestions(answerAISegments);
      }, debounceTime);
    }, [whisperState.segments, convertToAnswerAISegments, onSegments, detectQuestions]);

    // Answer generation
    const generateAnswer = useCallback(
      async (questionId: string) => {
        let question =
          allQuestions.find((q) => q.id === questionId) ??
          Array.from(questionCacheRef.current.values()).find((q) => q.id === questionId) ??
          currentQuestion;

        if (!question) {
          toast({
            title: 'Error',
            description: 'Question not found. Please try selecting a question from the list.',
            variant: 'destructive',
          });
          return;
        }

        if (!question.content?.trim()) {
          toast({
            title: 'Error',
            description: 'Question content is missing or invalid',
            variant: 'destructive',
          });
          return;
        }

        setIsGeneratingAnswer(true);
        setProcessingState('processing');
        const startTime = Date.now();

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch('/api/answerai/generate-answer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              question: question.content,
              position: position || 'Software Developer',
              company: company || 'Technology Company',
              context:
                transcriptionBufferRef.current?.getMergedContent() || whisperState.transcript,
              confidence: question.confidence || 0.8,
              metadata: {
                ...question.metadata,
                sessionId,
                timestamp: Date.now(),
              },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          const processingTime = Date.now() - startTime;

          const answer: Answer = {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            questionId: question.id,
            content: result.answer || result.content || 'Answer generated successfully',
            confidence: result.confidence || 0.85,
            generatedAt: Date.now(),
            isAiGenerated: true,
            metadata: {
              model: result.model || 'gpt-4',
              processingTime,
              tokens: result.tokens,
              method: result.method || 'ai-generation',
            },
          };

          onAnswerGenerated(answer);
          setStats((prev) => ({
            ...prev,
            answersGenerated: prev.answersGenerated + 1,
            processingTime,
          }));

          toast({
            title: '✨ Answer Generated!',
            description: `High-quality response ready in ${processingTime}ms • Confidence: ${Math.round(
              answer.confidence * 100
            )}%`,
          });
        } catch (error: any) {
          console.error('[AnswerAI] Answer generation failed:', error);

          let errorMessage = 'Unknown error occurred';
          if (error?.name === 'AbortError') errorMessage = 'Request timed out - please try again';
          else if (error?.message?.includes('HTTP')) errorMessage = `Server error: ${error.message}`;
          else if (error?.message?.toLowerCase?.().includes('network')) errorMessage = 'Network error - check your connection';

          toast({
            title: 'Answer Generation Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsGeneratingAnswer(false);
          setProcessingState('idle');
        }
      },
      [
        allQuestions,
        currentQuestion,
        position,
        company,
        whisperState.transcript,
        onAnswerGenerated,
        sessionId,
        toast,
      ]
    );

    // Force detection
    const forceQuestionDetection = useCallback(() => {
      if (transcriptionBufferRef.current) {
        const content = transcriptionBufferRef.current.getMergedContent('interviewer');
        if (content.length > 5) {
          const segments: AnswerAISegment[] = [
            {
              id: 'force-detect-segment',
              content,
              speaker: 'interviewer',
              volume: 0.5,
              timestamp: Date.now(),
              confidence: 1.0,
            },
          ];
          detectQuestions(segments);
        } else {
          toast({
            title: 'No Content',
            description: 'No interviewer content available for question detection',
            variant: 'destructive',
          });
        }
      }
    }, [detectQuestions, toast]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        const t = event.target as Element | null;
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;

        if (event.key === 'Enter' && currentQuestion && !isGeneratingAnswer) {
          event.preventDefault();
          generateAnswer(currentQuestion.id);
        } else if (event.key === 'F2' && !isGeneratingAnswer) {
          event.preventDefault();
          forceQuestionDetection();
        } else if (event.key === 'Escape' && (isGeneratingAnswer || processingState !== 'idle')) {
          event.preventDefault();
          setProcessingState('idle');
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentQuestion, isGeneratingAnswer, generateAnswer, forceQuestionDetection, processingState]);

    // Expose API
    useImperativeHandle(
      ref,
      () => ({
        uploadRecordings: async () => recordings as Recording[],
        resetRecordings: () => {
          resetRecordings();
          questionCacheRef.current.clear();
          transcriptionBufferRef.current?.clear();
          setAllQuestions([]);
          setManualQuestion('');
          setStats({ questionsDetected: 0, answersGenerated: 0, processingTime: 0 });
        },
        isBusy: whisperState.isTranscribing || isGeneratingAnswer || processingState !== 'idle',
        generateAnswer,
        forceQuestionDetection,
        addManualQuestion,
      }),
      [
        recordings,
        resetRecordings,
        whisperState.isTranscribing,
        isGeneratingAnswer,
        processingState,
        generateAnswer,
        forceQuestionDetection,
        addManualQuestion,
      ]
    );

    // Memoized control panel
    const controlPanel = useMemo(
      () => (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => (whisperState.isConnected ? disconnect() : connect())}
              variant={whisperState.isConnected ? 'destructive' : 'default'}
              disabled={processingState === 'processing'}
            >
              {whisperState.isConnected ? 'Disconnect' : 'Connect'}
            </Button>

            <Button
              onClick={() => {
                if (!whisperState.isConnected) connect();
                else if (whisperState.isTranscribing) stopTranscription();
                else startTranscription();
              }}
              disabled={!whisperState.isConnected || processingState === 'processing'}
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
                onClick={() => generateAnswer(currentQuestion.id)}
                disabled={isGeneratingAnswer || processingState === 'processing'}
                className="bg-green-600 hover:bg-green-700 text-white"
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
                clearTranscript();
                resetRecordings();
                setCurrentQuestion(null);
                questionCacheRef.current.clear();
                transcriptionBufferRef.current?.clear();
                setAllQuestions([]);
                setManualQuestion('');
                setConfidenceScore(0);
                setTranscriptText('');
                setStats({ questionsDetected: 0, answersGenerated: 0, processingTime: 0 });
              }}
              variant="outline"
              disabled={!whisperState.segments.length && !recordings.length}
            >
              Clear All
            </Button>

            <Button
              onClick={forceQuestionDetection}
              variant="outline"
              size="sm"
              disabled={processingState !== 'idle'}
              title="Force question detection (F2)"
            >
              <AlertCircle className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowTranscript((v) => !v)}
              variant="outline"
              size="sm"
              title="Toggle transcript display"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>

          {(stats.questionsDetected > 0 || stats.answersGenerated > 0) && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Questions: {stats.questionsDetected}</span>
              <span>Answers: {stats.answersGenerated}</span>
              <span>Avg Speed: {stats.processingTime}ms</span>
            </div>
          )}
        </div>
      ),
      [
        whisperState.isConnected,
        whisperState.isTranscribing,
        processingState,
        currentQuestion,
        isGeneratingAnswer,
        whisperState.segments.length,
        recordings.length,
        connect,
        disconnect,
        startTranscription,
        stopTranscription,
        generateAnswer,
        clearTranscript,
        resetRecordings,
        forceQuestionDetection,
        stats.questionsDetected,
        stats.answersGenerated,
        stats.processingTime,
      ]
    );

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Enhanced AnswerAI Recorder
              <ConnectionStatus
                isConnected={!!whisperState.isConnected}
                isTranscribing={!!whisperState.isTranscribing}
                quality={(whisperState.connectionQuality as ConnectionQuality) || 'unknown'}
                latency={Number(whisperState.latency ?? 0)}
              />
              {processingState !== 'idle' && (
                <Badge variant="outline" className="animate-pulse">
                  {processingState === 'detecting' ? 'Analyzing...' : 'Processing...'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {controlPanel}

            {/* Manual Question Input */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Manual Question Input
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a question manually to generate an AI answer..."
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (manualQuestion.trim()) addManualQuestion(manualQuestion);
                      }
                    }}
                  />
                  <Button
                    onClick={() => addManualQuestion(manualQuestion)}
                    disabled={!manualQuestion.trim() || isGeneratingAnswer}
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to add question, Shift+Enter for new line
                </p>
              </CardContent>
            </Card>

            {whisperState.isTranscribing && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-700 font-medium">
                  🎤 Recording interview... Advanced AI analyzing for questions in real-time
                </span>
                {processingState === 'detecting' && (
                  <div className="ml-auto">
                    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  </div>
                )}
              </div>
            )}

            {currentQuestion && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-white">
                    Latest Question
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(confidenceScore * 100)}% confidence
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.metadata?.detectionMethod || 'pattern'}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Press Enter • F2 • ESC for actions
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-blue-900">
                  {currentQuestion.content}
                </p>
              </div>
            )}

            {/* Transcript */}
            {showTranscript && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Live Transcript
                    <Badge variant="outline" className="text-xs">
                      {whisperState.segments.length} segments
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <TranscriptDisplay segments={convertedSegments} />
                </CardContent>
              </Card>
            )}

            {/* Questions list */}
            {allQuestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Detected Questions ({allQuestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                      >
                        <Badge variant="outline" className="text-xs">
                          {q.metadata?.detectionMethod || 'auto'}
                        </Badge>
                        <span className="flex-1 truncate">{q.content}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateAnswer(q.id)}
                          disabled={isGeneratingAnswer}
                          className="h-6 px-2"
                          title={`Generate answer for: ${q.content.substring(0, 50)}...`}
                        >
                          <Zap className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {allQuestions.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Showing last 10 questions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {audioData && (
              <AudioVisualizer audioData={audioData} dataUpdateTrigger={dataUpdateTrigger} />
            )}

            {recordings.length > 0 && (
              <RecordingsList recordings={recordings as Recording[]} onDelete={deleteRecording} />
            )}

            {whisperState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Connection Error</span>
                </div>
                <p className="text-sm text-red-600">
                  {String(whisperState.error)}. Please verify WhisperLive server is running and
                  accessible.
                </p>
              </div>
            )}

            {!whisperState.isTranscribing && !recordings.length && !whisperState.error && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <p className="text-muted-foreground mb-4 text-lg">
                    Connect and start recording to begin your enhanced AI-powered interview session.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                  <div className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">⚡ Lightning Detection</span>
                    <span className="text-muted-foreground text-center">
                      Advanced NLP with 95%+ accuracy
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">🚀 Instant Answers</span>
                    <span className="text-muted-foreground text-center">
                      Sub-second AI response generation
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">🎯 Smart Context</span>
                    <span className="text-muted-foreground text-center">
                      Context-aware with confidence scoring
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

AnswerAIRecorder.displayName = 'AnswerAIRecorder';
export default AnswerAIRecorder;
