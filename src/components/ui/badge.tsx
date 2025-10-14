// src/components/ui/badge.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'gradient';

interface BadgeProps extends React.ComponentPropsWithoutRef<typeof motion.span> {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 shadow-sm'
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    outline: 'border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200 bg-transparent',
    gradient: 'bg-gradient-to-r from-green-500 to-blue-500 text-white',
  }

  return (
    <motion.span
      className={cn(base, variants[variant], className)}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.span>
  )
}