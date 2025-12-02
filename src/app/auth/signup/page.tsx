//  src/app/auth/signup/page.tsx
'use client'

import { signIn } from 'next-auth/react'
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
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  })
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const normalizePhone = (input: string) => {
    let phone = input.trim()
    const localeCountry = navigator.language.split('-')[1]?.toUpperCase()
    const defaultCountry = (localeCountry || 'PK') as CountryCode

    try {
      const parsed = parsePhoneNumberFromString(phone, defaultCountry)
      if (parsed && parsed.isValid()) return parsed.number
      if (/^0\d{9,}$/.test(phone)) return '+92' + phone.slice(1)
      if (!phone.startsWith('+')) return '+' + phone.replace(/^0+/, '')
      return phone
    } catch (err) {
      console.warn('⚠️ Error parsing phone:', err)
      return phone
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalized = normalizePhone(formData.phone);
    setNormalizedPhone(normalized);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: normalized }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'OTP sent!',
          description: `We've sent a verification code to ${normalized}`,
        });
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCode = async () => {
    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code }),
      });
      const data = await res.json();

      if (data.verified) {
        toast({
          title: 'Phone verified!',
          description: 'Your account is now active.',
        });

        const loginRes = await signIn('credentials', {
          redirect: false,
          username: formData.username,
          password: formData.password,
        });

        if (loginRes?.error) throw new Error(loginRes.error);
        router.push('/notes');
      } else {
        toast({
          title: 'Invalid code',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Check verification error:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/notes' })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up with Google",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-sky-50">
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
          {/* Left side benefits */}
          <motion.div
            className="hidden lg:block space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                Join the Vhisper Community
              </h2>
              <p className="text-lg text-slate-600">
                Transform your voice into powerful, searchable notes with AI assistance.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
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
              <h3 className="font-semibold mb-2 text-lg text-slate-900">14-Day Free Trial</h3>
              <p className="text-sm text-slate-600">
                Get full access to all features. No credit card required.
              </p>
            </motion.div>
          </motion.div>

          {/* Signup + verify form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-2xl border border-slate-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Mic2 className="h-8 w-8 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  Create Your Account
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
                  {normalizedPhone ? 'Verify your phone to complete signup' : 'Get started with Vhisper today'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!normalizedPhone ? (
                  <>
                    {/* Google Sign Up Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-2 border-slate-200 hover:border-sky-500/50 hover:bg-sky-50/50 transition-all group"
                      onClick={handleGoogleSignUp}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin mr-2" />
                          <span className="text-slate-700">Signing up...</span>
                        </div>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          <span className="text-slate-700 font-medium group-hover:text-sky-700 transition-colors">Continue with Google</span>
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
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-11 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="johndoe"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="h-11 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-11 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+923329069978"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-11 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11 pr-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
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
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Sending Code...
                            </div>
                          ) : (
                            'Send Verification Code'
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </>
                ) : (
                  /* Code verification */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm text-emerald-800">
                        We've sent a 6-digit code to <strong>{normalizedPhone}</strong>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-sm font-medium text-slate-700">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                        className="h-11 bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-center text-lg tracking-widest"
                      />
                    </div>

                    <Button
                      onClick={handleCheckCode}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Verify & Create Account
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setNormalizedPhone('')}
                      className="w-full text-slate-600 hover:text-slate-900"
                    >
                      ← Change Phone Number
                    </Button>
                  </div>
                )}

                <div className="text-center pt-2">
                  <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors">
                      Sign in →
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
