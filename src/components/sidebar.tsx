'use client'

import Link from 'next/link'
import { FileText, Phone, Settings, LogOut, Mic2, Crown, Users, BarChart3, CreditCard } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

export function Sidebar() {
  const { data: session } = useSession()

  return (
    <aside className="w-64 min-h-screen bg-background border-r flex flex-col justify-between">
      {/* Top: Logo + Links */}
      <div>
        <div className="p-4 flex items-center space-x-3">
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600
                     rounded-lg rotate-6 transition-transform duration-300" />
            <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
          </div>
          <span className="font-bold text-lg">Vhisper</span>
        </div>
        <nav className="flex flex-col space-y-1 px-2">
          {session?.user?.role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="flex items-center px-3 py-2 rounded hover:bg-accent">
                <Crown className="mr-2 h-4 w-4 text-orange-500" />
                Dashboard
              </Link>
              <Link href="/admin/users" className="flex items-center px-3 py-2 rounded hover:bg-accent">
                <Users className="mr-2 h-4 w-4 text-blue-500" />
                Manage Users
              </Link>
              <Link href="/admin/analytics" className="flex items-center px-3 py-2 mt-1 rounded hover:bg-accent">
                <BarChart3 className="mr-2 h-4 w-4 text-green-500" />
                Analytics
              </Link>

              <Link href="/admin/plans" className="flex items-center px-3 py-2 mt-1 rounded hover:bg-accent">
                <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                Manage Plans
              </Link>
              <hr className="my-2 border-muted-foreground/50" />

            </>
          )}
          <Link href="/notes" className="flex items-center px-3 py-2 rounded hover:bg-accent">
            <FileText className="mr-2 h-4 w-4" /> Notes
          </Link>
           <Link href="/answerai" className="flex items-center px-3 py-2 rounded hover:bg-accent">
            <FileText className="mr-2 h-4 w-4" /> AnswerAi
          </Link>
          <Link href="/dialer" className="flex items-center px-3 py-2 rounded hover:bg-accent">
            <Phone className="mr-2 h-4 w-4" /> Dialer
          </Link>
          <Link href="/settings" className="flex items-center px-3 py-2 rounded hover:bg-accent">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </nav>
      </div>

      {/* Bottom: Sign out */}
      <div className="px-2 pb-4">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center px-3 py-2 rounded hover:bg-accent text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}