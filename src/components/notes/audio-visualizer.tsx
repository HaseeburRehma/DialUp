'use client'

import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  audioData: Uint8Array | null
  dataUpdateTrigger: number
}

export function AudioVisualizer({ audioData, dataUpdateTrigger }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !audioData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const data = audioData
    const sliceWidth = width / data.length

    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgb(34, 197, 94)' // green-500
    ctx.beginPath()

    let x = 0
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] ?? 0) / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }, [audioData, dataUpdateTrigger])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={100}
      className="w-full h-14 bg-background border rounded"
    />
  )
}