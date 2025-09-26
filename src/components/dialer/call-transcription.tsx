'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Copy, Download, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CallTranscriptionProps {
  isTranscribing: boolean
  transcript: string
  callDuration: string
}

export function CallTranscription({ isTranscribing, transcript, callDuration }: CallTranscriptionProps) {
  const { toast } = useToast()
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (isAutoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript, isAutoScroll])

  const copyTranscript = async () => {
    if (!transcript) return
    
    try {
      await navigator.clipboard.writeText(transcript)
      toast({
        title: 'Copied',
        description: 'Transcript copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy transcript',
        variant: 'destructive'
      })
    }
  }

  const downloadTranscript = () => {
    if (!transcript) return

    const content = `Call Transcript\n` +
                   `Duration: ${callDuration}\n` +
                   `Date: ${new Date().toLocaleString()}\n` +
                   `${'='.repeat(50)}\n\n` +
                   transcript

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-transcript-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: 'Transcript saved as text file'
    })
  }

  const handleScroll = () => {
    if (!transcriptRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = transcriptRef.current
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10
    setIsAutoScroll(isAtBottom)
  }

  if (!isTranscribing && !transcript) return null

  return (
    <Card className="bg-slate-900 border-slate-700 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Live Transcription
            </h3>
            
            {isTranscribing && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse mr-2" />
                Live
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            {transcript && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTranscript}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadTranscript}
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div 
          ref={transcriptRef}
          onScroll={handleScroll}
          className={`
            bg-slate-800/50 rounded-lg p-4 transition-all duration-300
            ${isExpanded ? 'min-h-[400px] max-h-[600px]' : 'min-h-[120px] max-h-[300px]'}
            overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800
          `}
        >
          {transcript ? (
            <div className="space-y-2">
              {transcript.split('\n').map((line, index) => {
                if (!line.trim()) return null
                
                const isAgentMessage = line.includes('🤖') || line.toLowerCase().includes('assistant')
                const isUserMessage = !isAgentMessage
                
                return (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg ${
                      isAgentMessage 
                        ? 'bg-blue-500/10 border-l-2 border-blue-500/50 text-blue-100' 
                        : isUserMessage
                        ? 'bg-green-500/10 border-l-2 border-green-500/50 text-green-100'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-slate-400 mb-2">
                  {isTranscribing ? 'Listening for speech...' : 'No transcription available'}
                </div>
                {isTranscribing && (
                  <div className="flex justify-center space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.6s'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {transcript && !isAutoScroll && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAutoScroll(true)
                if (transcriptRef.current) {
                  transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
                }
              }}
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Scroll to bottom
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}