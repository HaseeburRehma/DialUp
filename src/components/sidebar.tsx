'use client'

import { FileText, Phone, Settings, LogOut, Mic2, Crown, Users, BarChart3, CreditCard, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NextLink from 'next/link'

// Mock session and navigation hooks
function useSession() {
  return {
    data: {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      }
    }
  }
}

function usePathname() {
  return window.location.pathname
}

function signOut() {
  console.log('Sign out clicked')
  // In a real app, this would handle sign out
}

// Mock Link component
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  )
}


export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

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
    <aside className="fixed left-0 top-20 bottom-0 w-72 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col">
      {/* Navigation */}
      <div className="flex-1 p-6">
        <nav className="space-y-2">
          {session?.user?.role === 'admin' && (
            <>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-3">
                  Administration
                </h3>
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.href) 
                        ? 'bg-white/20 text-black shadow-lg shadow-blue-500/20' 
                        : 'text-black/70 hover:bg-black/10 hover:text-green'
                    }`}>
                      <item.icon className={`mr-3 h-5 w-5 ${item.color} ${
                        isActive(item.href) ? 'scale-110' : 'group-hover:scale-105'
                      } transition-transform duration-200`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive(item.href) && (
                        <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-black/20 my-6"></div>
            </>
          )}
          
          <div>
            <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-3">
              Workspace
            </h3>
            {userNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href) 
                    ? 'bg-white/20 text-black shadow-lg shadow-blue-500/20' 
                    : 'text-black/70 hover:bg-black/10 hover:text-green'
                }`}>
                  <item.icon className={`mr-3 h-5 w-5 ${item.color} ${
                    isActive(item.href) ? 'scale-110' : 'group-hover:scale-105'
                  } transition-transform duration-200`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </div>

    
    </aside>
  )
}