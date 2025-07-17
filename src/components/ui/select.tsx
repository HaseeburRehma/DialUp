'use client'
import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // layout
      'group relative flex items-center justify-between w-full h-10 px-3',

      // fonts
      'text-sm leading-tight',

      // light & dark theme inputs
      'bg-input text-input-foreground border border-input',
      'dark:bg-popover dark:text-popover-foreground dark:border-popover',

      // shape & shadow
      'rounded-md shadow-sm',

      // interactions
      'cursor-pointer hover:bg-input/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',

      className
    )}
    {...props}
  >
    <SelectPrimitive.Value placeholder={props.placeholder} className="flex-1 truncate" />
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="w-4 h-4 opacity-50 transition group-hover:opacity-80" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, sideOffset = 4, align = 'start', position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        // match trigger width
        'min-w-[var(--radix-select-trigger-width)]',

        // light & dark theme inputs
        'bg-input text-input-foreground border border-input',
        'dark:bg-popover dark:text-popover-foreground dark:border-popover',

        // shape & layering
        'rounded-md shadow-lg z-50 overflow-hidden',

        className
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6">
        <ChevronUp className="w-4 h-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{props.children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6">
        <ChevronDown className="w-4 h-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
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
      'flex items-center px-2 py-1 text-sm cursor-pointer rounded-md',

      // hover & focus
      'hover:bg-accent focus:bg-accent',

      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText />
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'
