// src/components/dialer/AudioVisualizer.tsx
'use client'

import React, { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
    audioData: Uint8Array | null
    isActive: boolean
    color?: string
    barCount?: number
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    audioData,
    isActive,
    color = '#2563eb', // blue-600
    barCount = 30
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>()

    useEffect(() => {
        if (!isActive || !audioData || !canvasRef.current) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const draw = () => {
            if (!isActive || !audioData) return

            animationRef.current = requestAnimationFrame(draw)

            const width = canvas.width
            const height = canvas.height
            const barWidth = (width / barCount) - 2

            ctx.clearRect(0, 0, width, height)

            let x = 0
            const step = Math.floor(audioData.length / barCount)

            for (let i = 0; i < barCount; i++) {
                const value = audioData[i * step] || 128
                const amplitude = Math.abs(value - 128)
                const barHeight = (amplitude / 128) * height * 2 + 2

                ctx.fillStyle = color
                const y = (height - barHeight) / 2

                ctx.beginPath()
                ctx.roundRect(x, Math.max(0, y), barWidth, Math.min(height, barHeight), 5)
                ctx.fill()

                x += barWidth + 2
            }
        }

        draw()

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [isActive, audioData, color, barCount])

    return (
        <canvas
            ref={canvasRef}
            width={120}
            height={30}
            className="w-full h-8 opacity-80"
        />
    )
}
