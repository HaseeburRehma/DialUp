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
      color: 'from-blue-500 to-purple-600',
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
      color: 'from-purple-500 to-pink-600',
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3 h-3 mr-1" />
                Choose Your Plan
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Start free, upgrade when you need more. All plans include our core features with no hidden fees.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center bg-muted p-1 rounded-full">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                  className="rounded-full"
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                  className="rounded-full"
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => (
                <Card
                  key={plan.name}
                  className={cn(
                    'relative overflow-hidden transition-all duration-300 hover:scale-105',
                    plan.popular 
                      ? 'ring-2 ring-blue-500 shadow-2xl scale-105' 
                      : 'hover:shadow-xl'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
                      <Star className="w-4 h-4 inline mr-1" />
                      Most Popular
                    </div>
                  )}

                  <CardHeader className={cn(
                    'text-center pb-4',
                    plan.popular ? 'pt-12' : 'pt-6'
                  )}>
                    <div className={cn(
                      'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
                      plan.color
                    )}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    
                    <div className="pt-4">
                      {typeof plan.price[billingCycle] === 'number' ? (
                        <div>
                          <span className="text-4xl font-bold">
                            ${plan.price[billingCycle]}
                          </span>
                          <span className="text-muted-foreground">
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                          {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                            <div className="text-sm text-green-600 mt-1">
                              Save ${(plan.price.monthly * 12) - plan.price.yearly} per year
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
                    <Button 
                      className={cn(
                        'w-full transition-all duration-200',
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                          : 'border border-input hover:bg-accent'
                      )}
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={session ? '/notes' : '/auth/signup'}>
                        {plan.name === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>

                    <Separator />

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Usage Limits */}
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
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need
              </h2>
              <p className="text-xl text-muted-foreground">
                Powerful features to transform your voice into actionable insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {additionalFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-6 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about our pricing and plans
              </p>
            </div>

            <div className="max-w-3xl mx-auto grid gap-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Voice Notes?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who use Vhisper to capture, transcribe, and enhance their ideas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link href={session ? '/notes' : '/auth/signup'}>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}