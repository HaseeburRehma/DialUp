// app/providers.tsx
'use client'

import { useState, useEffect, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'  // ← your custom Toaster

export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => void setMounted(true), [])

  if (!mounted) {
    return <SessionProvider>{children}</SessionProvider>
  }

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />    
      </ThemeProvider>
    </SessionProvider>
  )
}
