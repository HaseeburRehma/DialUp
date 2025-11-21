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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({ x: event.clientX, y: event.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated particles in organized formations */}
            {[...Array(375)].map((_, i) => {
                // Create grid-based positioning with slight randomness for organized formations
                const gridCols = 25;
                const gridRows = 15;
                const col = i % gridCols;
                const row = Math.floor(i / gridCols);

                // Base grid position with random offset for organic feel
                const baseX = (col / gridCols) * 100;
                const baseY = (row / gridRows) * 100;
                const randomOffsetX = (Math.random() - 0.3) * 2; // Small random offset
                const randomOffsetY = (Math.random() - 0.3) * 2;

                const randomX = baseX + randomOffsetX;
                const randomY = baseY + randomOffsetY;
                const size = Math.random() * 2 + 1.5;
                const delay = Math.random() * 4;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${randomX}%`,
                            top: `${randomY}%`,
                            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#6366f1' : '#8b5cf6',
                        }}
                        animate={{
                            x: [
                                0,
                                (mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)) * 0.002,
                                0
                            ],
                            y: [
                                0,
                                (mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 500)) * 0.002,
                                0
                            ],
                            scale: [1, 1.05, 1],

                        }}
                        transition={{
                            duration: 10 + delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: delay,
                        }}
                    />
                );
            })}
        </div>
    );
}
