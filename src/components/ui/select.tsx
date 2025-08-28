
//  src/components/ui/select.tsx

'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

// Exclude conflicting props from HTMLMotionProps
type MotionSelectTriggerProps = Omit<
  HTMLMotionProps<"button">,
  "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "style"
>

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  placeholder?: string;
}

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, placeholder, style, ...props }, ref) => (
  <SelectPrimitive.Trigger
    asChild
    ref={ref}
    {...props}
  >
    <motion.button
      className={cn(
        'group relative flex items-center justify-between w-full h-11 px-4',
        'text-sm font-medium leading-tight',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600',
        'rounded-lg shadow-sm',
        'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      style={style as React.CSSProperties}
      {...props as MotionSelectTriggerProps}
    >
      <SelectPrimitive.Value placeholder={placeholder} className="flex-1 truncate" />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="w-4 h-4 opacity-60 transition group-hover:opacity-80" />
      </SelectPrimitive.Icon>
    </motion.button>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, sideOffset = 4, align = 'start', position = 'popper', style, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'min-w-[var(--radix-select-trigger-width)]',
          'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-foreground border-0',
          'rounded-lg shadow-lg z-50 overflow-hidden',
          className
        )}
        style={style as React.CSSProperties}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 text-muted-foreground">
          <ChevronUp className="w-4 h-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{props.children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 text-muted-foreground">
          <ChevronDown className="w-4 h-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </motion.div>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'flex items-center px-3 py-2 text-sm cursor-pointer rounded-md',
      'hover:bg-gradient-to-r hover:from-green-500/20 hover:to-blue-500/20 focus:bg-gradient-to-r focus:from-green-500/20 focus:to-blue-500/20',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText />
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'