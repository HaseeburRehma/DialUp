
// src/app/pricing/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  Check,
  Star,
  Zap,
  Crown,
  Mic,
  FileText,
  Cloud,
  Users,
  Phone,
  Shield,
  Headphones,
  BarChart3,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { MeshDistortMaterial, OrbitControls, Sphere } from '@react-three/drei'
import { VoiceAIVisual } from '@/components/3d/VoiceVisual'

export default function PricingPage() {
  const { data: session } = useSession()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Free',
      displayName: 'Starter',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out Vhisper',
      icon: Mic,
      color: 'from-gray-500 to-gray-600',
      popular: false,
      features: [
        '10 minutes of transcription/month',
        'Basic voice recording',
        'Simple text editing',
        'Export to PDF/TXT',
        'Web app access',
        'Community support'
      ],
      limits: {
        monthlyMinutes: 10,
        storageGB: 0.5,
        maxUsers: 1
      }
    },
    {
      name: 'pro',
      displayName: 'Professional',
      price: { monthly: 19, yearly: 190 },
      description: 'For professionals and power users',
      icon: Zap,
      color: 'from-green-500 to-blue-500',
      popular: true,
      features: [
        '500 minutes of transcription/month',
        'AI-enhanced transcription',
        'Voice-to-text in 50+ languages',
        'Smart formatting & punctuation',
        'Advanced editing tools',
        'Cloud sync across devices',
        'Priority email support',
        'Export to multiple formats',
        'Custom templates',
        'Voice commands'
      ],
      limits: {
        monthlyMinutes: 500,
        storageGB: 10,
        maxUsers: 1
      }
    },
    {
      name: 'team',
      displayName: 'Team',
      price: { monthly: 49, yearly: 490 },
      description: 'Perfect for teams and organizations',
      icon: Users,
      color: 'from-blue-500 to-purple-600',
      popular: false,
      features: [
        '2000 minutes of transcription/month',
        'Everything in Professional',
        'Team collaboration',
        'Shared workspaces',
        'User management',
        'Analytics & insights',
        'API access',
        'Custom integrations',
        'Advanced security',
        'Dedicated account manager',
        'Phone support',
        'Custom onboarding'
      ],
      limits: {
        monthlyMinutes: 2000,
        storageGB: 100,
        maxUsers: 10
      }
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      price: { monthly: 'Custom', yearly: 'Custom' },
      description: 'For large organizations with custom needs',
      icon: Crown,
      color: 'from-orange-500 to-red-600',
      popular: false,
      features: [
        'Unlimited transcription',
        'Everything in Team',
        'Single Sign-On (SSO)',
        'Advanced analytics',
        'Custom deployment',
        'Dedicated infrastructure',
        'SLA guarantees',
        'Custom feature development',
        'White-label options',
        '24/7 phone support',
        'On-site training',
        'Compliance certifications'
      ],
      limits: {
        monthlyMinutes: 0, // unlimited
        storageGB: 1000,
        maxUsers: 100
      }
    }
  ]

  const additionalFeatures = [
    {
      icon: FileText,
      title: 'Smart Transcription',
      description: 'AI-powered speech-to-text with 99% accuracy'
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Access your notes from any device, anywhere'
    },
    {
      icon: Phone,
      title: 'Call Recording',
      description: 'Record and transcribe phone calls automatically'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance certifications'
    },
    {
      icon: Headphones,
      title: 'Multi-language Support',
      description: 'Transcribe in 50+ languages with high accuracy'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track usage, productivity, and team insights'
    }
  ]

  const faqs = [
    {
      question: 'Can I change my plan anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.'
    },
    {
      question: 'What happens if I exceed my monthly limits?',
      answer: 'If you exceed your monthly transcription minutes, you can either upgrade your plan or purchase additional minutes at $0.10 per minute.'
    },
    {
      question: 'Is there a free trial for paid plans?',
      answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, we\'ll refund your payment.'
    },
    {
      question: 'Can I use Vhisper offline?',
      answer: 'The web app requires an internet connection, but recorded audio is stored locally until you\'re back online for transcription.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption, and your data is stored securely in SOC 2 compliant data centers.'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:50px_50px] [mask-image:radial-gradient(black_10%,transparent_80%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20" />

          {/* Floating Elements */}
          <motion.div
            className="absolute top-10 left-20 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 blur-2xl"
            animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-15 blur-3xl"
            animate={{ y: [0, 20, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1 }}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Badge variant="secondary" className="mb-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Choose Your Plan
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Simple, Transparent Pricing
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                  Start free, upgrade when you need more. All plans include our core AI-powered features with no hidden fees.
                </p>
              </motion.div>

              {/* 3D Visual */}

              <VoiceAIVisual />
              {/* Billing Toggle */}
              <motion.div
                className="inline-flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-1 rounded-full mt-8"
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                  className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                  className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Save 20%
                  </Badge>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card
                  className={cn(
                    'relative overflow-hidden border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl',
                    plan.popular && 'ring-2 ring-green-500 shadow-2xl scale-105'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-blue-500 text-white text-center py-2 text-sm font-medium">
                      <Star className="w-4 h-4 inline mr-1" />
                      Most Popular
                    </div>
                  )}

                  <CardHeader className={cn(
                    'text-center pb-4',
                    plan.popular ? 'pt-12' : 'pt-6'
                  )}>
                    <motion.div
                      className={cn(
                        'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
                        plan.color
                      )}
                      whileHover={{ scale: 1.1 }}
                    >
                      <plan.icon className="w-8 h-8 text-white" />
                    </motion.div>

                    <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{plan.description}</CardDescription>

                    <div className="pt-4">
                      {typeof plan.price[billingCycle] === 'number' ? (
                        <div>
                          <span className="text-4xl font-bold">
                            ${plan.price[billingCycle]}
                          </span>
                          <span className="text-muted-foreground">
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                          {billingCycle === 'yearly' && Number(plan.price.monthly) > 0 && (
                            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                              Save ${Number(plan.price.monthly) * 12 - Number(plan.price.yearly)} per year
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-muted-foreground">
                          Contact Sales
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        className={cn(
                          'w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
                          plan.popular ? '' : 'border border-input bg-transparent text-foreground hover:bg-accent'
                        )}
                        variant={plan.popular ? 'default' : 'outline'}
                        asChild
                      >
                        <Link href={session ? '/notes' : '/auth/signup'}>
                          {plan.name === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </motion.div>

                    <Separator />

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Usage Limits</h4>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Monthly Minutes:</span>
                          <span className="font-medium">
                            {plan.limits.monthlyMinutes === 0 ? 'Unlimited' : plan.limits.monthlyMinutes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span className="font-medium">{plan.limits.storageGB} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span className="font-medium">{plan.limits.maxUsers}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Additional Features */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/30 dark:to-blue-950/30">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Everything You Need
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features to transform your voice into actionable insights
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {additionalFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4 p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto grid gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 text-lg">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative bg-gradient-to-r from-green-600 to-blue-600 py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Voice Notes?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who use Vhisper to capture, transcribe, and enhance their ideas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="group bg-white text-primary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
                    asChild
                  >
                    <Link href={session ? '/notes' : '/auth/signup'}>
                      <Users className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                      Start Free Trial
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/contact">
                      Contact Sales
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}