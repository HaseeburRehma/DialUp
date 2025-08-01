'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Github,
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
  Mic2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ]
  const dashboardPrefixes = ["/admin", "/notes", "/dialer", "/settings"]; const isDashboardRoute = dashboardPrefixes.some((p) =>
    pathname.startsWith(p)
  );
  const isAdmin = session?.user?.role === 'admin'

  return (
    <header className={cn(
      'fixed top-0 z-50 w-full transition-all duration-300 ease-in-out',
      isScrolled
        ? 'bg-background/80 backdrop-blur-md border-b shadow-sm'
        : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          {!isDashboardRoute && (
            <>
              <Link
                href="/"
                className="flex items-center space-x-3 group transition-transform hover:scale-105"
              >
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                  <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
                  Vhisper
                </span>
              </Link>

              {/* Desktop Navigation */}
              {!isDashboardRoute && (
                <nav className="hidden md:flex items-center space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary relative group py-2',
                        pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {item.name}
                      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-500 to-green-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </Link>
                  ))}
                </nav>
              )}
            </>

          )}

          <div className="flex‑1" />


          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* GitHub button */}
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="https://github.com" target="_blank">
                <Github className="h-4 w-4" />
              </Link>
            </Button>

            {session ? (
              <DropdownMenu>
                {!isDashboardRoute && (
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        {session.user?.name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                 )}

                <DropdownMenuContent
                  className="w-64 p-2"
                  align="end"
                  forceMount
                  sideOffset={10}
                >
                  <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        {session.user?.name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-none">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                      {isAdmin && (
                        <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full w-fit mt-1">
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
                      Pricing & Plans
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center cursor-pointer text-orange-600 dark:text-orange-400">
                          <Crown className="mr-3 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="flex items-center cursor-pointer text-orange-600 dark:text-orange-400">
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
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                </Button>

              </div>
            )}

            {/* Mobile menu button */}
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-sm border-t mt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 text-base font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
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