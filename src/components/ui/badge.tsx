// ui/badge.tsx
'use client'

import React from 'react'

export type BadgeVariant = 'default' | 'secondary' | 'destructive'

interface BadgeProps {
    variant?: BadgeVariant
    children: React.ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        secondary: 'bg-blue-100 text-blue-800',
        destructive: 'bg-red-100 text-red-800',
    }
    return (
        <span className={`${base} ${variants[variant]}`}>
            {children}
        </span>
    )
}
