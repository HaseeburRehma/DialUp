//src/components/ui/interactive-background.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionTemplate } from 'framer-motion'

export function InteractiveBackground({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)

    const mouseX = useSpring(0, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(0, { stiffness: 500, damping: 100 })

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <div
            ref={ref}
            className={`relative group ${className}`}
            onMouseMove={onMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.1),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    )
}

export function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let particles: Array<{
            x: number
            y: number
            baseX: number
            baseY: number
            size: number
            color: string
            density: number
        }> = []

        const colors = ['#3b82f6', '#6366f1', '#8b5cf6']

        const init = () => {
            particles = []
            const width = canvas.width
            const height = canvas.height

            // Create a grid of particles
            const columns = Math.floor(width / 40) // Adjust spacing
            const rows = Math.floor(height / 40)

            for (let i = 0; i < columns; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = (i * 40) + (Math.random() * 10 - 5)
                    const y = (j * 40) + (Math.random() * 10 - 5)

                    particles.push({
                        x,
                        y,
                        baseX: x,
                        baseY: y,
                        size: Math.random() * 2 + 1,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        density: (Math.random() * 30) + 1
                    })
                }
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i]

                // Mouse interaction
                const dx = mouseRef.current.x - p.x
                const dy = mouseRef.current.y - p.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const forceDirectionX = dx / distance
                const forceDirectionY = dy / distance
                const maxDistance = 150 // Interaction radius
                const force = (maxDistance - distance) / maxDistance
                const directionX = forceDirectionX * force * p.density
                const directionY = forceDirectionY * force * p.density

                if (distance < maxDistance) {
                    p.x -= directionX
                    p.y -= directionY
                } else {
                    if (p.x !== p.baseX) {
                        const dx = p.x - p.baseX
                        p.x -= dx / 10
                    }
                    if (p.y !== p.baseY) {
                        const dy = p.y - p.baseY
                        p.y -= dy / 10
                    }
                }

                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
            }
            animationFrameId = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.offsetWidth
                canvas.height = containerRef.current.offsetHeight
                init()
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (canvas) {
                const rect = canvas.getBoundingClientRect()
                mouseRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                }
            }
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)

        handleResize()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            <canvas
                ref={canvasRef}
                className="w-full h-full opacity-60"
            />
        </div>
    )
}
