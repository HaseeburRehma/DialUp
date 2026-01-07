'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Users, Crown, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  const { data: session } = useSession()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Starter',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for individuals getting started',
      features: [
        '10 minutes of transcription/month',
        'Basic voice recording',
        'Simple text editing',
        'Export to PDF/TXT',
        'Web app access',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      price: { monthly: 19, yearly: 190 },
      description: 'For professionals and power users',
      features: [
        '500 minutes of transcription/month',
        'AI-enhanced transcription',
        'Voice-to-text in 50+ languages',
        'Advanced editing tools',
        'Cloud sync across devices',
        'Priority email support',
        'Custom templates',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Team',
      price: { monthly: 49, yearly: 490 },
      description: 'Perfect for teams and organizations',
      features: [
        '2000 minutes of transcription/month',
        'Everything in Professional',
        'Team collaboration',
        'Shared workspaces',
        'User management',
        'Analytics & insights',
        'API access',
        'Dedicated account manager',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[#fafbff] pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Simple, Transparent Pricing
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Choose the perfect plan for your needs
                </h1>

                <p className="text-xl text-slate-600 mb-8">
                  Start free, upgrade when you need more. All plans include our core AI-powered features.
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex items-center bg-slate-100 p-1 rounded-full">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-slate-600 hover:text-emerald-900'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-slate-600 hover:text-emerald-900'
                      }`}
                  >
                    Yearly
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative rounded-2xl border-2 p-8 ${plan.popular
                      ? 'border-emerald-500 shadow-xl scale-105'
                      : 'border-slate-200 hover:border-emerald-200 hover:shadow-lg'
                    } transition-all duration-300 bg-white`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-5xl font-bold">${plan.price[billingCycle]}</span>
                      <span className="text-slate-600 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                      {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                        <div className="text-sm text-emerald-600 mt-2">
                          Save ${plan.price.monthly * 12 - plan.price.yearly} per year
                        </div>
                      )}
                    </div>

                    <Button
                      className={`w-full ${plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      asChild
                    >
                      <Link href={session ? '/notes' : '/auth/signup'}>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold">Enterprise</h2>
                  </div>

                  <p className="text-xl text-slate-300 mb-8 max-w-2xl">
                    Custom solutions for large organizations with advanced needs. Unlimited transcription, dedicated support, and enterprise-grade security.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div>
                      <div className="text-3xl font-bold mb-1">Unlimited</div>
                      <div className="text-slate-400">Transcription minutes</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold mb-1">24/7</div>
                      <div className="text-slate-400">Dedicated support</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold mb-1">SSO</div>
                      <div className="text-slate-400">Single Sign-On</div>
                    </div>
                  </div>

                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                    Contact Sales
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-xl text-slate-600">
                  Everything you need to know about our pricing
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    q: 'Can I change my plan anytime?',
                    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
                  },
                  {
                    q: 'Is there a free trial?',
                    a: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start.',
                  },
                  {
                    q: 'What happens if I exceed my limits?',
                    a: 'You can either upgrade your plan or purchase additional minutes at $0.10 per minute.',
                  },
                  {
                    q: 'Do you offer refunds?',
                    a: 'We offer a 30-day money-back guarantee for all paid plans.',
                  },
                ].map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                    <p className="text-slate-600">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}