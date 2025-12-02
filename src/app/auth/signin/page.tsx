// src/app/auth/signin/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mic2, ArrowLeft, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { signIn } from "next-auth/react"

export default function SignInPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await signIn("credentials", {
      redirect: false,
      username: formData.username,
      password: formData.password,
    })

    if (res?.error) {
      toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Success", description: "Signed in successfully." })
      router.push("/notes")
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/notes' })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      })
      setGoogleLoading(false)
    }
  }

  const benefits = [
    'Unlimited voice recordings',
    'AI-powered transcription',
    'Smart note enhancement',
    'Cross-device sync',
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <Button variant="ghost" size="sm" className="mr-2 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300" />
            <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
            Vhisper
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Benefits Section */}
          <motion.div
            className="hidden lg:block space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                Welcome Back to Vhisper
              </h2>
              <p className="text-lg text-slate-600">
                Continue transforming your voice into powerful, searchable notes.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-slate-700">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="font-semibold mb-2 text-lg text-slate-900">New to Vhisper?</h3>
              <p className="text-sm text-slate-600">
                Sign up for a free trial and get full access to all features for 14 days.
              </p>
            </motion.div>
          </motion.div>

          {/* Sign In Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-2xl border border-slate-200 bg-white/80 backdrop-blur-sm w-full max-w-md mx-auto">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Mic2 className="h-8 w-8 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
                  Sign in to continue your voice note journey
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 transition-all group"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin mr-2" />
                      <span className="text-slate-700">Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-slate-700 font-medium group-hover:text-emerald-700 transition-colors">Continue with Google</span>
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                      placeholder="Enter your username"
                      className="h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                        placeholder="Enter your password"
                        className="h-11 pr-10 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-slate-500"
                        onClick={() => setShowPassword(v => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    New to Vhisper?{' '}
                    <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                      Create your account →
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}