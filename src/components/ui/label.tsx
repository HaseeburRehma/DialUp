// components/ui/label.tsx

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

// Exclude conflicting drag-related props from HTMLMotionProps
type MotionLabelProps = Omit<HTMLMotionProps<"label">, "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver">

const labelVariants = cva(
  "block text-sm font-medium leading-none transition-all duration-200",
  {
    variants: {
      variant: {
        default: "text-foreground bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent",
        subtle: "text-muted-foreground",
      },
      size: {
        default: "mb-1.5",
        sm: "mb-1 text-xs",
        lg: "mb-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, ...props }, ref) => (
    <motion.label
      ref={ref}
      className={cn(labelVariants({ variant, size, className }))}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      {...props as MotionLabelProps} // Type-safe props spreading
    />
  )
)
Label.displayName = "Label"