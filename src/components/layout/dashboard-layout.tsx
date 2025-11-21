// src/components/layout/dashboard-layout.tsx
'use client'

import { useState } from 'react'
import { Header } from './header'
import { Sidebar } from './../sidebar'
import { useCustomSession } from '@/hooks/use-custom-session'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useCustomSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-300/40 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="relative bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-emerald-500 border-r-sky-500" />
            <span className="text-slate-800 font-medium">
              Loading your workspace…
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
          <p className="text-slate-800 font-medium">
            Please sign in to continue.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex pt-16 md:pt-20 relative">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Main content */}
        <main
          className={cn(
            'flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 transition-all duration-300',
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
          )}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
