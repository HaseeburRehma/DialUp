//  src/components/ui/spinner.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Import the cn utility

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeMap: Record<string, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]', // Adjusted border syntax for Tailwind CSS
    lg: 'w-16 h-16 border-4',
  };

  return (
    <motion.div
      className={cn(
        'rounded-full animate-spin border-t-transparent border-[color:linear-gradient(to_right,#10b981,#3b82f6)]', // Use Tailwind's color syntax for gradient
        sizeMap[size]
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}