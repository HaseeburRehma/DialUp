// ui/tabs.tsx

'use client'

import * as React from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export const Tabs = ({
  children,
  ...props
}: React.PropsWithChildren<RadixTabs.TabsProps>) => (
  <RadixTabs.Root {...props}>{children}</RadixTabs.Root>
)

export const TabsList = React.forwardRef<
  HTMLDivElement,
  RadixTabs.TabsListProps
>(({ className, style, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      'flex border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-t-lg',
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  RadixTabs.TabsTriggerProps
>(({ className, style, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      'px-4 py-2 -mb-px text-sm font-medium cursor-pointer',
      'data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:border-b-0',
      'hover:bg-gradient-to-r hover:from-green-500/20 hover:to-blue-500/20',
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  RadixTabs.TabsContentProps
>(({ className, style, ...props }, ref) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <RadixTabs.Content
      ref={ref}
      className={cn(
        'p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-b-lg shadow-md',
        className
      )}
      style={style as React.CSSProperties}
      {...props}
    />
  </motion.div>
))
TabsContent.displayName = 'TabsContent'