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
import { Eye, EyeOff, Mic2, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { MeshDistortMaterial, OrbitControls, Sphere } from '@react-three/drei'
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
      // Step 1️⃣: Create user (pending) and send OTP automatically
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: normalized }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'OTP sent!',
          description: `We’ve sent a verification code to ${normalized}`,
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

        // ✅ Log user in right away
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


  const benefits = [
    'Unlimited voice recordings',
    'AI-powered transcription',
    'Smart note enhancement',
    'Cross-device sync',
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <Button variant="ghost" size="sm" className="mr-2 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300" />
            <Mic2 className="absolute inset-0 h-8 w-8 text-white p-1.5" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Join the Vhisper Community
              </h2>
              <p className="text-lg text-muted-foreground">
                Transform your voice into powerful, searchable notes with AI assistance.
              </p>
            </div>

            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Signup + verify form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Mic2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Create Your Account
                </CardTitle>
                <CardDescription className="text-base">
                  Verify your phone before creating an account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    type="tel"
                    placeholder="+923329069978"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </Button>
                </form>

                {/* Step 2: code verification */}
                {normalizedPhone && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Label htmlFor="code">Enter 6-digit Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      onClick={handleCheckCode}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Verify & Create Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
