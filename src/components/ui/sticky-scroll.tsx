'use client'

import React, { useRef } from 'react'
import { useMotionValueEvent, useScroll } from 'framer-motion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string
        description: string
        image: string
    }[]
    contentClassName?: string
}) => {
    const [activeCard, setActiveCard] = React.useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        container: ref,
        offset: ['start start', 'end start'],
    })
    const cardLength = content.length

    useMotionValueEvent(scrollYProgress, 'change', (latest) => {
        const cardsBreakpoints = content.map((_, index) => index / cardLength)
        const closestBreakpointIndex = cardsBreakpoints.reduce(
            (acc, breakpoint, index) => {
                const distance = Math.abs(latest - breakpoint)
                if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
                    return index
                }
                return acc
            },
            0
        )
        setActiveCard(closestBreakpointIndex)
    })

    return (
        <motion.div
            className="h-screen overflow-y-auto flex flex-col lg:flex-row justify-center relative lg:space-x-16 scrollbar-hide bg-white"
            ref={ref}
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {/* Text Content */}
            <div className="relative flex items-start w-full lg:w-1/2">
                <div className="max-w-2xl w-full">
                    {content.map((item, index) => (
                        <div key={item.title + index} className="min-h-screen flex flex-col justify-start pt-20">
                            <motion.h2
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-4xl lg:text-5xl font-bold text-slate-900"
                            >
                                {item.title}
                            </motion.h2>
                            <motion.p
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-lg text-slate-600 max-w-lg mt-8 leading-relaxed"
                            >
                                {item.description}
                            </motion.p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Image */}
            <div className="hidden lg:flex lg:w-1/2 items-start justify-start sticky top-0 h-screen pb-10 pt-20">
                <motion.div
                    className={cn(
                        'relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-slate-100',
                        contentClassName
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {content.map((item, index) => (
                        <motion.div
                            key={item.title + index}
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: activeCard === index ? 1 : 0,
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Custom scrollbar hide styles */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </motion.div>
    )
}
