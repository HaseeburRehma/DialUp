// src/components/ui/input.tsx

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileFocus={{ scale: 1.02, boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }}
        transition={{ duration: 0.2 }}
      >
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all duration-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }