'use client'

import { motion } from 'framer-motion'
import { Code, Database, Globe, Layout, Server, Smartphone, Zap, Shield, Cloud, Cpu, Terminal, Activity } from 'lucide-react'

const icons = [
    Code, Database, Globe, Layout, Server, Smartphone, Zap, Shield, Cloud, Cpu, Terminal, Activity
]

export function IconWave() {
    return (
        <div className="relative w-full h-32 md:h-48 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10" />

            <div className="flex gap-8 md:gap-12 min-w-max px-4">
                {icons.map((Icon, index) => (
                    <motion.div
                        key={index}
                        className="relative"
                        animate={{
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.2,
                        }}
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:scale-110 transition-all duration-300">
                            <Icon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                    </motion.div>
                ))}
                {/* Duplicate for infinite feel if needed, or just enough items */}
                {icons.map((Icon, index) => (
                    <motion.div
                        key={`dup-${index}`}
                        className="relative hidden md:block"
                        animate={{
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (index + icons.length) * 0.2,
                        }}
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:scale-110 transition-all duration-300">
                            <Icon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
