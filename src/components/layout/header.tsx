// src/components/layout/header.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogIn,
  LogOut,
  Settings,
  FileText,
  Phone,
  Menu,
  X,
  Crown,
  Users,
  CreditCard,
  Mic2,
  Bell,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCustomSession } from '@/hooks/use-custom-session'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session, status } = useCustomSession()
  const pathname = usePathname() ?? ''

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dashboardPrefixes = [
    '/admin',
    '/notes',
    '/dialer',
    '/settings',
    '/answerai',
    '/ai-agents',
  ]
  const isDashboardRoute = dashboardPrefixes.some((p) =>
    pathname.startsWith(p)
  )
  const isAdmin = session?.user?.role === 'admin'

  if (status === 'loading') return null
  if (isDashboardRoute && !session) return null

  const navigation = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ]

  /* DASHBOARD HEADER (light) */
  if (isDashboardRoute) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
          {/* Logo + mobile menu */}
          <div className="flex items-center space-x-3">
            <button
              className="md:hidden mr-1 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5 text-slate-800" />
            </button>

            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-sm">
                  <Mic2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-semibold text-base md:text-lg text-slate-900">
                  Vhisper
                </h1>
                <p className="text-xs text-slate-500">
                  Voice Intelligence Workspace
                </p>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="hidden lg:block flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notes, recordings, contacts…"
                className="w-full pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/60"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-sky-500 text-white text-sm">
                      {session?.user?.name?.charAt(0) ?? ''}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-64 p-2 bg-white border border-slate-200 text-slate-900 shadow-lg"
                align="end"
                sideOffset={10}
              >
                <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-slate-50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
                      {session?.user?.name?.charAt(0) ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-none">
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {session?.user?.email}
                    </p>
                    {isAdmin && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/notes" className="flex items-center cursor-pointer">
                    <FileText className="mr-3 h-4 w-4" />
                    My Notes
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/dialer" className="flex items-center cursor-pointer">
                    <Phone className="mr-3 h-4 w-4" />
                    Voice Dialer
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="flex items-center cursor-pointer">
                    <CreditCard className="mr-3 h-4 w-4" />
                    Pricing &amp; Plans
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center cursor-pointer text-amber-500"
                      >
                        <Crown className="mr-3 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/users"
                        className="flex items-center cursor-pointer text-amber-500"
                      >
                        <Users className="mr-3 h-4 w-4" />
                        Manage Users
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={async () => {
                    await signOut({ callbackUrl: '/' })
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  }

  /* LANDING HEADER (light) */
  return (
    <header
      className={cn(
        'fixed top-0 z-30 w-full transition-all duration-300 ease-in-out',
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link
            href="/"
            className="flex items-center space-x-3 group transition-transform hover:scale-105"
          >
            <div className="relative">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300" />
              <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
              Vhisper
            </span>
          </Link>

          <div className="flex-1 flex justify-center">
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-emerald-600 relative group py-2',
                    pathname === item.href
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  )}
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
                        {session.user?.name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 p-2 bg-white border border-slate-200 shadow-lg"
                  align="end"
                  sideOffset={10}
                >
                  <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-slate-50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
                        {session.user?.name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-none">
                      <p className="font-medium text-slate-900">
                        {session.user?.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {session.user?.email}
                      </p>
                      {isAdmin && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/notes" className="flex items-center cursor-pointer">
                      <FileText className="mr-3 h-4 w-4" />
                      My Notes
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dialer" className="flex items-center cursor-pointer">
                      <Phone className="mr-3 h-4 w-4" />
                      Voice Dialer
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="flex items-center cursor-pointer">
                      <CreditCard className="mr-3 h-4 w-4" />
                      Pricing &amp; Plans
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center cursor-pointer text-amber-500"
                        >
                          <Crown className="mr-3 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin/users"
                          className="flex items-center cursor-pointer text-amber-500"
                        >
                          <Users className="mr-3 h-4 w-4" />
                          Manage Users
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  asChild
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Link href="/auth/signin" className="flex items-center">
                    <span className="relative z-10 flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </span>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </Link>
                </Button>
              </motion.div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 text-base font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'text-emerald-600 bg-slate-100'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
