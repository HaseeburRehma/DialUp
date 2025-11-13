// src/components/layout/dashboard-layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { Sidebar } from './../sidebar'
import { useCustomSession } from '@/hooks/use-custom-session'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useCustomSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ---------------------------------------------
   * LOADING STATE
   * -------------------------------------------*/
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-blue-400 border-r-teal-400"></div>
              <span className="text-white/90 font-medium">Loading your workspace...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------
   * NOT SIGNED IN
   * -------------------------------------------*/
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="text-white/90 text-lg font-medium">
          Please sign in to continue
        </div>
      </div>
    )
  }

  /* ---------------------------------------------
   * MAIN LAYOUT
   * -------------------------------------------*/
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white ">

      {/* Ambient Background Blur Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-32 w-[32rem] h-[32rem] bg-blue-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-48 -left-44 w-[28rem] h-[28rem] bg-purple-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 -left-32 w-[34rem] h-[34rem] bg-pink-300/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex pt-20 relative z-10">
        
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="
          flex-1 
          md:ml-72 
          p-4 md:p-8 
          transition-all duration-300 ease-in-out
        ">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}
