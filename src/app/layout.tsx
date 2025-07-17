// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import type { ReactNode } from 'react';
import { SettingsProvider } from '@/hooks/SettingsContext'

import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Vhisper – Voice Notes with AI Transcriptions',
  description: 'Write notes using your voice, automatically transcribe them, and refine with AI.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={inter.className}
      suppressHydrationWarning
    >
      <head /> 
      <body suppressHydrationWarning>
        <Providers>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  )
}
