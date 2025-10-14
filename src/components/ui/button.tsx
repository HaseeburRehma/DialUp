// components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

// Exclude conflicting props from HTMLMotionProps, including style, drag-related, and animation-related props
type MotionButtonProps = Omit<
  HTMLMotionProps<"button">,
  "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "style" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
        outline: "border border-gray-300 dark:border-gray-600 bg-transparent text-foreground hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700",
        ghost: "bg-transparent text-foreground hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
        gradient: "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-12 px-8 rounded-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      children,
      disabled,
      style, // Extract style prop to handle it explicitly
      ...props
    },
    ref
  ) => {
    // Use Slot for asChild, otherwise use motion.button
    const Comp = asChild ? Slot : motion.button

    let content: React.ReactNode = children

    if (asChild) {
      const validChildren = React.Children.toArray(children).filter(
        (child) => !(typeof child === "string" && child.trim() === "")
      )
      content = validChildren.length === 1 ? validChildren[0] : validChildren
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        // Pass style prop explicitly for Slot compatibility
        style={style as React.CSSProperties}
        // Only apply motion props if not asChild
        {...(!asChild && {
          whileHover: { scale: 1.05, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
          whileTap: { scale: 0.95 },
        })}
        {...props as MotionButtonProps} // Type-safe props spreading
      >
        <span className="inline-flex items-center">
          {loading && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {content}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }