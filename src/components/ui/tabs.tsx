// ui/tabs.tsx
'use client'

import * as React from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'

export const Tabs = ({ children, ...props }) => (
  <RadixTabs.Root {...props}>{children}</RadixTabs.Root>
)

export const TabsList = React.forwardRef<
  HTMLDivElement,
  RadixTabs.TabsListProps
>((props, ref) => (
  <RadixTabs.List
    ref={ref}
    className="flex border-b"
    {...props}
  />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  RadixTabs.TabsTriggerProps
>((props, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className="px-4 py-2 -mb-px text-sm font-medium cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-primary"
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  RadixTabs.TabsContentProps
>((props, ref) => (
  <RadixTabs.Content
    ref={ref}
    className="p-4"
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'
