'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Github,
  LogIn,
  LogOut,
  Settings,
  FileText,
  Phone,
} from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="h-6 w-6 bg-primary rounded" />
          <span className="font-bold">Vhisper</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />

          {/* GitHub button */}
          <Link href="https://github.com" target="_blank" passHref>
            <Button variant="ghost" size="sm">
              <Github className="h-4 w-4" />
            </Button>
          </Link>

          {session ? (
            <DropdownMenu>
              {/* native button trigger, no asChild */}
              <DropdownMenuTrigger>
                <div
                  className="relative h-8 w-8 rounded-full bg-transparent p-0 focus:outline-none"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-none">
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Link href="/notes" passHref>
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link href="/dialer" passHref>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      Dialer
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link href="/settings" passHref>
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => signOut()}>
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signin" passHref>
              <Button size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
