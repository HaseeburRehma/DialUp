// src/components/layout/dashboard-layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { Sidebar } from './../sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Mock session hook for demo purposes
function useSession() {
  const [session, setSession] = useState<any>(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // Simulate loading and setting a mock session
    setTimeout(() => {
      setSession({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin'
        }
      })
      setStatus('authenticated')
    }, 1000)
  }, [])

  return { data: session, status }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-blue-400 border-r-teal-400"></div>
              <span className="text-white/90 font-medium">Loading your workspace...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-white">Please sign in to continue</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">

      {/* Ambient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/20 rounded-full blur-[120px]"></div>

        <div className="absolute top-40 -left-40 w-80 h-80 bg-white-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-pink-300/20 rounded-full blur-[120px]"></div>
      </div>

      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 pt-20 relative z-10">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />  {/* ← control here */}
        <main className="flex-1 md:p-8 md:ml-72 transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}