'use client'

import * as React from 'react'
import { motion, useMotionValue, animate, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CarouselProps {
    items: React.ReactNode[]
    className?: string
}

export function Carousel({ items, className }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)

    // Calculate constraints based on item width and count
    // For simplicity in this "Antigravity" demo, we'll use a fixed width logic or percentage
    // But a true robust carousel needs measure.
    // Let's go with a simpler "Card Slider" approach where we show 3 items at a time on desktop.

    const next = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            setCurrentIndex(0) // Loop back
        }
    }

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        } else {
            setCurrentIndex(items.length - 1) // Loop to end
        }
    }

    // Auto-play effect
    React.useEffect(() => {
        const timer = setInterval(() => {
            next()
        }, 5000)
        return () => clearInterval(timer)
    }, [currentIndex])

    return (
        <div className={cn("relative group", className)} ref={containerRef}>
            <div className="overflow-hidden px-4 py-8">
                <motion.div
                    className="flex gap-6"
                    animate={{
                        x: `-${currentIndex * 100}%`, // Simple percentage based slide for single item view, needs adjustment for multi-item
                        // For multi-item (e.g. 3 per row), we need to move by (100/3)% or similar.
                        // Let's try a different approach: The container moves, but we want to show multiple items.
                        // If we want to show 3 items, each item should be roughly 33% width.
                        // And we move by 33% * currentIndex.
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        // We will override the animate prop logic with a more responsive approach below in CSS/Style
                        // Actually, let's just use a simple transform for now.
                        transform: `translateX(-${currentIndex * (100 / (window.innerWidth > 768 ? 3 : 1))}%)`
                    }}
                >
                    {/* 
            Wait, the window.innerWidth usage in render is bad for SSR. 
            Let's stick to a simpler CSS grid or flex with proper motion.
          */}
                </motion.div>

                {/* 
           Let's rewrite this to be a simpler "overflow-x-auto" style with snap points 
           OR a proper framer motion drag carousel.
           Given the request for "Elegant", a smooth drag carousel is best.
        */}
            </div>
        </div>
    )
}

// Re-implementing as a proper Draggable Infinite-ish Carousel
export function ElegantCarousel({ items }: { items: React.ReactNode[] }) {
    const [width, setWidth] = React.useState(0)
    const carousel = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (carousel.current) {
            setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth)
        }
    }, [carousel.current])

    return (
        <motion.div
            ref={carousel}
            className="cursor-grab overflow-hidden"
            whileTap={{ cursor: "grabbing" }}
        >
            <motion.div
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                className="flex gap-8"
            >
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        className="min-w-[300px] md:min-w-[400px]" // Fixed width cards
                    >
                        {item}
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}
