'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/theme-toggle'
import { Eye, EyeOff, Mic2, ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1) Sign in with NextAuth (to get your NextAuth JWT cookie)
    const nextAuthResult = await signIn('credentials', {
      redirect: false,
      username: formData.username,
      password: formData.password,
    })

    if (!nextAuthResult?.ok) {
      toast({
        title: 'Error',
        description: nextAuthResult?.error ?? 'Invalid username or password.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // 2) ALSO sign in to your Express server so req.session.user is set
    try {
      const expressRes = await fetch('http://localhost:8000/api/auth/signin', {
        method: 'POST',
        credentials: 'include',               // <–– send+store the express-session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })
      if (!expressRes.ok) {
        throw new Error('Express sign-in failed')
      }
    } catch (err) {
      console.error('Express login error:', err)
      toast({
        title: 'Error',
        description: 'Could not log in to notes API. Please try again.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // 3) Success on both fronts!
    toast({ title: 'Success', description: 'Signed in successfully.' })
    router.push('/notes')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-green-900/20 dark:to-green-900/20">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300" />
            <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
            Vhisper
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <Mic2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to continue your voice note journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                  placeholder="Enter your username"
                  className="h-11 transition-all focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="h-11 pr-10 transition-all focus:ring-2 focus:ring-green-500/20"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">New to Vhisper?</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/auth/signup" className="text-green-600 hover:text-green-500 font-medium transition-colors">
                Create your account →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}