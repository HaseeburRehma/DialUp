// src/components/sidebar.tsx

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  FileText, Phone, Settings, LogOut, Crown, Users,
  BarChart3, CreditCard, Brain, ChevronLeft, ChevronRight
} from 'lucide-react'
import NextLink from 'next/link'

function Link({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  )
}

export function Sidebar({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (val: boolean) => void
}){
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isActive = (path: string) => pathname === path

  const adminNavItems = [
    { href: '/admin/dashboard', icon: Crown, label: 'Dashboard', color: 'text-orange-400' },
    { href: '/admin/users', icon: Users, label: 'Manage Users', color: 'text-blue-400' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'text-green-400' },
    { href: '/admin/plans', icon: CreditCard, label: 'Manage Plans', color: 'text-purple-400' },
  ]

  const userNavItems = [
    { href: '/notes', icon: FileText, label: 'Notes', color: 'text-emerald-400' },
    { href: '/answerai', icon: Brain, label: 'AnswerAI', color: 'text-cyan-400' },
    { href: '/dialer', icon: Phone, label: 'Dialer', color: 'text-pink-400' },
    { href: '/settings', icon: Settings, label: 'Settings', color: 'text-slate-400' },
  ]

  return (

    <>
      {/* Mobile toggle button in header (show only on small screens) 
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/20"
      >
        <ChevronRight className="h-6 w-6 text-black" />
      </button>
      */}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-20 bottom-0 left-0 z-40
          ${collapsed ? 'w-20' : 'w-72'}
          bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col transition-all duration-300
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Collapse / Close */}
        <button
          onClick={() => (window.innerWidth < 768 ? setOpen(false) : setCollapsed(!collapsed))}
          className="p-2 m-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <nav className="space-y-4">
            {session?.user?.role === 'admin' && (
              <div>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                )}
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${isActive(item.href)
                        ? 'bg-white/20 text-black shadow-lg shadow-blue-500/20'
                        : 'text-black/70 hover:bg-black/10'
                        }`}
                    >
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-2">
                  Workspace
                </h3>
              )}
              {userNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${isActive(item.href)
                      ? 'bg-white/20 text-black shadow-lg shadow-blue-500/20'
                      : 'text-black/70 hover:bg-black/10'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Footer: user info + logout */}
        {!collapsed && session?.user && (
          <div className="p-4 border-t border-white/20">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-black/60">{session.user.email}</p>
            <button
              onClick={() => signOut()}
              className="mt-2 flex items-center gap-2 text-sm text-red-500 hover:underline"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </aside>
      {/* Dark backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}