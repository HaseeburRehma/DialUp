// src/components/ui/separator.tsx
import * as React from 'react'
import { cn } from '@/lib/utils' // assuming you have a utility to merge classnames

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('shrink-0 bg-border h-[1px] w-full', className)}
      {...props}
    />
  )
)

Separator.displayName = 'Separator'

export { Separator }
