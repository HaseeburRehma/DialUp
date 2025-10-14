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
import { Eye, EyeOff, Mic2, ArrowLeft, Sparkles, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { MeshDistortMaterial, OrbitControls, Sphere } from '@react-three/drei'

export default function SignInPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

    toast({ title: 'Success', description: 'Signed in successfully.' })
    router.push('/notes')
    setLoading(false)
  }

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
          {/* Benefits Section */}
          <motion.div 
            className="hidden lg:block space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Welcome Back to Vhisper
              </h2>
              <p className="text-lg text-muted-foreground">
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
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="font-semibold mb-2 text-lg">New to Vhisper?</h3>
              <p className="text-sm text-muted-foreground">
                Sign up for a free trial and get full access to all features for 14 days.
              </p>
            </motion.div>

            {/* 3D Visual */}
            <motion.div 
              className="h-64"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Canvas>
                <OrbitControls enableZoom={false} enablePan={false} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <Sphere args={[1, 64, 64]} scale={1.5}>
                  <MeshDistortMaterial
                    color="#3b82f6"
                    attach="material"
                    distort={0.4}
                    speed={1.5}
                    roughness={0.5}
                  />
                </Sphere>
              </Canvas>
            </motion.div>
          </motion.div>

          {/* Sign In Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow- dobro2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm w-full max-w-md mx-auto">
              <CardHeader className="text-center space-y-4">
                <motion.div 
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <Mic2 className="h-8 w-8 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base">
                  Sign in to continue your voice note journey
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <motion.div whileHover={{ scale: 1.02 }} whileFocus={{ scale: 1.02 }}>
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                        placeholder="Enter your username"
                        className="h-11 transition-all focus:ring-2 focus:ring-green-500/20"
                        required
                      />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <motion.div whileHover={{ scale: 1.02 }} whileFocus={{ scale: 1.02 }}>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                          placeholder="Enter your password"
                          className="h-11 pr-10 transition-all focus:ring-2 focus:ring-green-500/20"
                          required
                        />
                      </motion.div>
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

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <span className="flex items-center">
                          Sign In
                          <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/90 dark:bg-gray-900/90 text-gray-500">New to Vhisper?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Create your account →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}