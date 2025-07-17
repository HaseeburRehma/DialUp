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
import { Eye, EyeOff } from 'lucide-react'

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
    toast({ title: 'Success', description: 'Signed in.' })
    router.push('/notes')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to access your notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create one now
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
