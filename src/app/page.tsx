// src/app/page.tsx

'use client'
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Play, Sparkles, Zap, ArrowRight, Volume2, Star, Users, DollarSign } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MotionConfig } from 'framer-motion' // Import MotionConfig for group support
import { motion } from 'framer-motion'

import { Canvas } from '@react-three/fiber'

import { VoiceAIVisual } from '@/components/3d/VoiceVisual'

const features = [
  {
    icon: Mic,
    title: "Voice Recording",
    description: "Record multiple voice clips within a single note. Perfect for lectures, meetings, or quick thoughts."
  },
  {
    icon: Sparkles,
    title: "AI Transcription",
    description: "Automatic speech-to-text conversion with high accuracy. Edit and refine transcriptions as needed."
  },
  {
    icon: Zap,
    title: "AI Enhancement",
    description: "Optional post-processing to improve transcription clarity, fix grammar, and enhance your notes."
  }
]

const testimonials = [
  {
    name: "Sarah M.",
    role: "Student",
    quote: "Vhisper transformed how I take notes in lectures. The AI transcription is spot-on, and I love the sleek interface!",
    rating: 5,
    avatar: "/avatars/sarah.jpg"
  },
  {
    name: "James T.",
    role: "Entrepreneur",
    quote: "This app saves me hours by turning my meeting recordings into actionable notes instantly. Highly recommend!",
    rating: 5,
    avatar: "/avatars/james.jpg"
  },
  {
    name: "Emily R.",
    role: "Writer",
    quote: "The AI enhancement feature is a game-changer for my creative process. My notes are clearer and more organized than ever.",
    rating: 4,
    avatar: "/avatars/emily.jpg"
  }
]

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated Background with Grid */}
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:50px_50px] [mask-image:radial-gradient(black_10%,transparent_80%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20" />

          {/* Floating Elements */}
          <motion.div
            className="absolute top-10 left-20 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg opacity-20 blur-2xl"
            animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg opacity-15 blur-3xl"
            animate={{ y: [0, 20, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1 }}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Content */}
              <motion.div
                className="space-y-6 md:space-y-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-primary/20 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">AI-Powered Voice Intelligence</span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                  Transform Your
                  <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Voice Into
                  </span>
                  <span className="block text-foreground">Smart Notes</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Record, transcribe, and enhance your thoughts with AI superpowers. Turn every conversation into searchable, actionable insights.
                </p>

                {/* Buttons in a Single Row */}
                <div className="flex flex-row gap-4 items-center justify-start w-full">
                  {/* Start Recording Now */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="default"
                      size="lg"
                      className="group bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                      asChild
                    >
                      <Link href={session ? '/notes' : '/auth/signup'} className="flex items-center">
                        <Mic className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                        <span>{session ? 'View Your Notes' : 'Start Recording Now'}</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </motion.div>

                  {/* Watch Demo */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="group bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-300 flex items-center"
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                      <span>Watch Demo</span>
                    </Button>
                  </motion.div>
                </div>


                {/* Stats */}
                <div className="flex flex-wrap gap-6 sm:gap-8 pt-6 md:pt-8">
                  {[
                    { value: "99%", label: "Accuracy" },
                    { value: "10M+", label: "Notes Created" },
                    { value: "50+", label: "Languages" }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                    >
                      <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Content - Elegant 3D Visual */}
              {/* Right Content - Voice AI 3D Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="relative">
                  <div className="relative z-10 h-64 md:h-96 lg:h-[500px] transform hover:scale-105 transition-transform duration-500">

                    <VoiceAIVisual />
                    {/* Rotating Glass Cube */}


                  </div>



                  {/* Floating UI Elements */}
                  <motion.div
                    className="absolute -top-4 -right-4 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-green-500/20"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">Recording...</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-4 -left-4 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-500/20"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, delay: 1 }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">AI Processing</div>
                    </div>
                  </motion.div>

                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 blur-3xl rounded-lg scale-125 -z-10" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="w-6 h-10 border-2 border-green-500/30 rounded-lg flex justify-center">
              <div className="w-1 h-3 bg-green-500 rounded-lg mt-2 animate-pulse" />
            </div>
          </motion.div>
        </section >

        {/* Features Section */}
        < section id="features" className="container mx-auto px-4 py-16 md:py-24" >
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Why Choose Vhisper?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="hover:shadow-xl transition-shadow duration-300 border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardContent className="p-6 md:p-8">
                    <motion.div
                      className="flex items-center gap-4 mb-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      <feature.icon className="text-primary size-10" />
                      <h3 className="text-xl md:text-2xl font-semibold">{feature.title}</h3>
                    </motion.div>
                    <p className="text-muted-foreground text-base">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section >

        {/* Testimonials Section */}
        < section className="relative bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/30 dark:to-blue-950/30 py-16 md:py-24" >
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              What Our Users Say
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 text-base italic">"{testimonial.quote}"</p>
                      <div className="flex items-center gap-3">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section >

        {/* Pricing Teaser Section */}
        < section className="container mx-auto px-4 py-16 md:py-24" >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Find the Perfect Plan
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're a student, professional, or creator, Vhisper has a plan tailored for you. Start for free today!
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="group bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/pricing" className="flex items-center text-white">
                  Explore Plans
                  <DollarSign className="w-5 h-5 ml-2 group-hover:animate-pulse" />
                </Link>
              </Button>
            </motion.div>

          </motion.div>
        </section >

        {/* CTA Banner */}
        < section className="relative bg-gradient-to-r from-green-600 to-blue-600 py-16 md:py-24" >
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Revolutionize Your Note-Taking?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are transforming their ideas with Vhisper's AI-powered voice notes.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href={session ? '/notes' : '/auth/signup'} className="flex items-center">
                    <Users className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    {session ? 'Go to Dashboard' : 'Get Started Free'}
                  </Link>
                </Button>
              </motion.div>

            </motion.div>
          </div>
        </section >
      </main >

      <Footer />
    </div >
  )
}