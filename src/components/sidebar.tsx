'use client'

import Link from 'next/link'
import { FileText, Phone, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-background border-r flex flex-col justify-between">
      {/* Top: Logo + Links */}
      <div>
        <div className="p-4 font-bold text-lg">Vhisper</div>
        <nav className="flex flex-col space-y-1 px-2">
          <Link href="/notes" className="flex items-center px-3 py-2 rounded hover:bg-accent">
            <FileText className="mr-2 h-4 w-4" /> Notes
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