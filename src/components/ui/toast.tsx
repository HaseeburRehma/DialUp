// src/components/ui/toast.tsx

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full max-w-md flex-col-reverse p-4 sm:bottom-0 sm:top-auto sm:flex-col",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border-0 p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-foreground",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white",
        success: "bg-gradient-to-r from-green-500 to-blue-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, style, ...props }, ref) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        style={style as React.CSSProperties}
        {...props}
      />
    </motion.div>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 text-sm font-medium",
      "hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2",
      "group-[.destructive]:from-red-500 group-[.destructive]:to-red-600 group-[.destructive]:hover:from-red-600 group-[.destructive]:hover:to-red-700",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-full p-1 text-foreground/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50 group-hover:opacity-100",
      "group-[.destructive]:text-red-200 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400",
      className
    )}
    toast-close=""
    style={style as React.CSSProperties}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent group-[.destructive]:text-white",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    style={style as React.CSSProperties}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}