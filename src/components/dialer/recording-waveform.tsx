'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Square, Circle } from 'lucide-react'

interface RecordingWaveformProps {
    isRecording: boolean
    isTranscribing: boolean
    callSeconds: number
}

export function RecordingWaveform({ isRecording, isTranscribing, callSeconds }: RecordingWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>()
    const audioContextRef = useRef<AudioContext>()
    const analyserRef = useRef<AnalyserNode>()
    const dataArrayRef = useRef<Uint8Array>()
    const [audioLevel, setAudioLevel] = useState(0)

    useEffect(() => {
        if (!isRecording && !isTranscribing) return

        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                const audioContext = new AudioContext()
                const analyser = audioContext.createAnalyser()
                const source = audioContext.createMediaStreamSource(stream)

                analyser.fftSize = 256
                source.connect(analyser)

                audioContextRef.current = audioContext
                analyserRef.current = analyser
                dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

                startVisualization()
            } catch (error) {
                console.error('Error setting up audio:', error)
            }
        }

        setupAudio()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [isRecording, isTranscribing])

    const startVisualization = () => {
        if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const draw = () => {
            if (!analyserRef.current || !dataArrayRef.current) return

            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount) as Uint8Array;

            // Calculate average audio level
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length
            setAudioLevel(average / 255)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const barWidth = canvas.width / dataArrayRef.current.length * 2.5
            let barHeight
            let x = 0

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, isRecording ? '#ef4444' : '#3b82f6')
            gradient.addColorStop(1, isRecording ? '#dc2626' : '#1d4ed8')

            for (let i = 0; i < dataArrayRef.current.length; i++) {
                barHeight = (dataArrayRef.current[i] / 255) * canvas.height

                ctx.fillStyle = gradient
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }

            animationRef.current = requestAnimationFrame(draw)
        }

        draw()
    }

    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

    return (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <Badge
                            className={`${isRecording
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                } px-3 py-1`}
                        >
                            {isRecording ? (
                                <>
                                    <Circle className="h-3 w-3 mr-2 fill-current animate-pulse" />
                                    Recording
                                </>
                            ) : (
                                <>
                                    <Mic className="h-3 w-3 mr-2" />
                                    Transcribing
                                </>
                            )}
                        </Badge>

                        <span className="text-white font-mono text-sm">
                            {formatTime(callSeconds)}
                        </span>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-slate-400">Audio Level</div>
                        <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-100 ${isRecording ? 'bg-red-400' : 'bg-blue-400'
                                        }`}
                                    style={{ width: `${audioLevel * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-slate-300 w-8">
                                {Math.round(audioLevel * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={120}
                        className="w-full h-20 bg-slate-800/50 rounded-lg"
                    />

                    {audioLevel === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-slate-400 text-sm">
                                {isRecording ? 'Waiting for audio input...' : 'Processing audio...'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Audio activity indicator */}
                <div className="mt-4 flex justify-center">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-8 mx-1 rounded-full transition-all duration-150 ${audioLevel * 5 > i
                                    ? (isRecording ? 'bg-red-400' : 'bg-blue-400')
                                    : 'bg-slate-700'
                                }`}
                            style={{
                                transform: audioLevel * 5 > i ? 'scaleY(1.2)' : 'scaleY(1)',
                            }}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}