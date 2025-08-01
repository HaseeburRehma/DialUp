// src/app/admin/users/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useToast } from '@/hooks/use-toast'
import {
  Users as UsersIcon,
  Search,
  MoreHorizontal,
  Crown,
  Shield,
  UserX,
  UserCheck,
  Mail,
  ArrowLeft,
  Copy
} from 'lucide-react'
import React from 'react'

interface User {
  _id: string
  name: string
  username: string
  email: string
  role?: 'user' | 'admin'
  plan?: 'free' | 'pro' | 'team' | 'enterprise'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  loginCount: number
}

export default function AdminUsers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
 const [roleFilter, setRoleFilter] = useState<string>('all')
const [planFilter, setPlanFilter] = useState<string>('all')


  useEffect(() => {
    if (status === 'loading') return
    if (!session) return router.push('/auth/signin')
    if (session.user?.role !== 'admin') return router.push('/')
    fetchUsers()
  }, [session, status, router])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      if (!res.ok) throw new Error()
      const { users } = await res.json()
      setUsers(users)
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleUserAction(userId: string, action: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: `User ${action} successfully` })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }
  if (!session || session.user?.role !== 'admin') return null

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    team: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-orange-100 text-orange-800',
  }

  const filtered = users.filter(u => {
    const t = searchTerm.toLowerCase()
    if (!u.name.toLowerCase().includes(t)
      && !u.email.toLowerCase().includes(t)
      && !u.username.toLowerCase().includes(t)
    ) return false
    if (roleFilter !== 'all' && (u.role ?? 'user') !== roleFilter) return false
    if (planFilter !== 'all' && (u.plan ?? 'free') !== planFilter) return false
    return true
  })

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">


          <div className="mb-6 p-6 bg-card rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username…"
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Native HTML select for Role */}
              <div className="w-40">
                <label htmlFor="roleFilter" className="sr-only">Role</label>
                <select
                  id="roleFilter"
                  className="w-full border rounded px-2 py-1"
                  value={roleFilter ?? ''}
                  onChange={e => setRoleFilter(e.target.value )}
                >
                  <option value="" disabled hidden>Role</option>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Native HTML select for Plan */}
              <div className="w-40">
                <label htmlFor="planFilter" className="sr-only">Plan</label>
                <select
                  id="planFilter"
                  className="w-full border rounded px-2 py-1"
                  value={planFilter ?? ''}
                  onChange={e => setPlanFilter(e.target.value )}
                >
                  <option value="" disabled hidden>Plan</option>
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="team">Team</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users ({filtered.length})</CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(user => {
                      const role = user.role ?? 'user'
                      const plan = user.plan ?? 'free'
                      return (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                              {role === 'admin' && <Crown className="inline h-3 w-3 mr-1" />}
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <span className={planColors[plan]}>
                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive
                                ? <><UserCheck className="inline h-3 w-3 mr-1" />Active</>
                                : <><UserX className="inline h-3 w-3 mr-1" />Inactive</>}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleString()
                              : 'Never'}
                            <div className="text-xs">
                              {user.loginCount} login{user.loginCount !== 1 && 's'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(user._id)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(user.email)}
                                >
                                  <Mail className="mr-2 h-4 w-4" />Copy Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {role !== 'admin' && (
                                  <DropdownMenuItem onClick={() => handleUserAction(user._id, 'make-admin')}>
                                    <Crown className="mr-2 h-4 w-4" />Make Admin
                                  </DropdownMenuItem>
                                )}
                                {role === 'admin' && user._id !== session.user?.id && (
                                  <DropdownMenuItem onClick={() => handleUserAction(user._id, 'remove-admin')}>
                                    <Shield className="mr-2 h-4 w-4" />Remove Admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, user.isActive ? 'deactivate' : 'activate')}
                                  className={user.isActive ? 'text-red-600' : 'text-green-600'}
                                >
                                  {user.isActive
                                    ? <><UserX className="mr-2 h-4 w-4" />Deactivate</>
                                    : <><UserCheck className="mr-2 h-4 w-4" />Activate</>}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No users found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  )
}
