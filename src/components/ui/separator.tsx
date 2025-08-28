// src/components/ui/separator.tsx

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

// Exclude conflicting props from HTMLMotionProps
type MotionDivProps = Omit<
  HTMLMotionProps<"div">,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "style"
>

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, style, ...props }, ref) => (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5 }}
      ref={ref}
      className={cn(
        'shrink-0 h-[2px] w-full bg-gradient-to-r from-green-500/50 to-blue-500/50',
        className
      )}
      style={style as React.CSSProperties}
      {...props as MotionDivProps}
    />
  )
)

Separator.displayName = 'Separator'

export { Separator }