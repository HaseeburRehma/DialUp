// src/components/ui/textarea.tsx

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileFocus={{ scale: 1.02, boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }}
        transition={{ duration: 0.2 }}
      >
        <textarea
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-3 text-sm',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all duration-200',
            className
          )}
          ref={ref}
          style={style as React.CSSProperties}
          {...props}
        />
      </motion.div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }