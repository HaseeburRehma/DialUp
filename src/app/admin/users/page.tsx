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
    if ((session.user as any)?.role !== 'admin') return router.push('/');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }
  if (!session || (session.user as any)?.role !== 'admin') return null

  const planColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-700 border-slate-200',
    pro: 'bg-blue-100 text-blue-700 border-blue-200',
    team: 'bg-purple-100 text-purple-700 border-purple-200',
    enterprise: 'bg-orange-100 text-orange-700 border-orange-200',
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
    <div className="min-h-screen flex flex-col bg-slate-50">

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <UsersIcon className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Manage Users
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              View and manage all registered users
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search by name, email, or username…"
                  className="pl-12 h-12 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Native HTML select for Role */}
              <div className="w-full md:w-48">
                <label htmlFor="roleFilter" className="sr-only">Role</label>
                <select
                  id="roleFilter"
                  className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-700 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-400 transition-all"
                  value={roleFilter ?? ''}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="" disabled hidden>Role</option>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Native HTML select for Plan */}
              <div className="w-full md:w-48">
                <label htmlFor="planFilter" className="sr-only">Plan</label>
                <select
                  id="planFilter"
                  className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-700 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-400 transition-all"
                  value={planFilter ?? ''}
                  onChange={e => setPlanFilter(e.target.value)}
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

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Users ({filtered.length})</CardTitle>
              <CardDescription className="text-slate-600">All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">User</TableHead>
                      <TableHead className="font-semibold text-slate-700">Role</TableHead>
                      <TableHead className="font-semibold text-slate-700">Plan</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Last Login</TableHead>
                      <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                      <TableHead className="w-12 font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(user => {
                      const role = user.role ?? 'user'
                      const plan = user.plan ?? 'free'
                      return (
                        <TableRow key={user._id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-semibold text-slate-900">{user.name}</div>
                              <div className="text-sm text-slate-600">{user.email}</div>
                              <div className="text-xs text-slate-500">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role === 'admin' ? 'default' : 'secondary'} className={role === 'admin' ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                              {role === 'admin' && <Crown className="inline h-3 w-3 mr-1" />}
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${planColors[plan]} border font-medium`}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? 'bg-green-100 text-green-700 border-green-200 border' : 'bg-red-100 text-red-700 border-red-200 border'}>
                              {user.isActive
                                ? <><UserCheck className="inline h-3 w-3 mr-1" />Active</>
                                : <><UserX className="inline h-3 w-3 mr-1" />Inactive</>}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleString()
                              : 'Never'}
                            <div className="text-xs text-slate-500">
                              {user.loginCount} login{user.loginCount !== 1 && 's'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-slate-200">
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
                                {role === 'admin' && user._id !== session?.user?.id && (
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
                  <div className="py-12 text-center text-slate-500">
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
