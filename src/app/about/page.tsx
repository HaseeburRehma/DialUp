'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import {
    Target,
    Heart,
    Zap,
    Users,
    Globe,
    Shield,
    Sparkles,
    ArrowRight,
    Linkedin,
    Twitter,
} from 'lucide-react'

export default function AboutPage() {
    const values = [
        {
            icon: Target,
            title: 'Innovation First',
            description: 'We push the boundaries of AI technology to deliver cutting-edge voice transcription solutions.',
        },
        {
            icon: Heart,
            title: 'User-Centric',
            description: 'Every feature we build is designed with our users\' needs and feedback at the forefront.',
        },
        {
            icon: Shield,
            title: 'Privacy & Security',
            description: 'Your data is yours. We employ bank-level encryption and never share your information.',
        },
        {
            icon: Globe,
            title: 'Accessibility',
            description: 'Making voice technology accessible to everyone, everywhere, in any language.',
        },
    ]

    const team = [
        {
            name: 'Sarah Chen',
            role: 'CEO & Co-founder',
            image: '/images/team/sarah.jpg',
            bio: 'Former VP of Product at a leading AI company. Passionate about making technology accessible.',
            social: { linkedin: '#', twitter: '#' },
        },
        {
            name: 'Michael Rodriguez',
            role: 'CTO & Co-founder',
            image: '/images/team/michael.jpg',
            bio: 'AI researcher with 10+ years in speech recognition. PhD from Stanford.',
            social: { linkedin: '#', twitter: '#' },
        },
        {
            name: 'Emily Watson',
            role: 'Head of Design',
            image: '/images/team/emily.jpg',
            bio: 'Award-winning product designer focused on creating intuitive user experiences.',
            social: { linkedin: '#', twitter: '#' },
        },
        {
            name: 'David Kim',
            role: 'Head of Engineering',
            image: '/images/team/david.jpg',
            bio: 'Full-stack engineer who loves building scalable, reliable systems.',
            social: { linkedin: '#', twitter: '#' },
        },
    ]

    const stats = [
        { value: '1M+', label: 'Active Users' },
        { value: '50+', label: 'Languages Supported' },
        { value: '99.9%', label: 'Uptime' },
        { value: '10M+', label: 'Hours Transcribed' },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-[#fafbff] pt-32 pb-20 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                                    <Sparkles className="w-4 h-4" />
                                    About Vhisper
                                </div>

                                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                                    Transforming how the world captures ideas
                                </h1>

                                <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                                    We're on a mission to make voice the most natural and powerful way to create, share, and organize information.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-white border-y border-slate-200">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-slate-600">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                                <p className="text-xl text-slate-600 leading-relaxed">
                                    We believe that everyone should be able to capture their thoughts and ideas effortlessly.
                                    By combining advanced AI with intuitive design, we're making voice the most powerful tool
                                    for productivity, creativity, and collaboration.
                                </p>
                            </motion.div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <h3 className="text-2xl font-bold mb-4">What We Do</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Vhisper uses cutting-edge AI to transform spoken words into accurate, searchable text.
                                        Whether you're recording a lecture, conducting an interview, or brainstorming ideas,
                                        we make it easy to capture, organize, and enhance your voice notes.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <h3 className="text-2xl font-bold mb-4">Why We Do It</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        We've all experienced the frustration of losing a great idea or struggling to take notes
                                        during important moments. We built Vhisper to solve this problem and empower people to
                                        focus on what matters most—their ideas, not the mechanics of capturing them.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl font-bold mb-4">Our Values</h2>
                                <p className="text-xl text-slate-600">
                                    The principles that guide everything we do
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                            {values.map((value, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                        <value.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                    <p className="text-slate-600">{value.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
                                <p className="text-xl text-slate-600">
                                    The people behind Vhisper
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                            {team.map((member, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                        <Users className="w-20 h-20 text-blue-600" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                                        <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                                        <p className="text-slate-600 text-sm mb-4">{member.bio}</p>
                                        <div className="flex gap-3">
                                            <a
                                                href={member.social.linkedin}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                            <a
                                                href={member.social.twitter}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Twitter className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="max-w-3xl mx-auto text-center text-white"
                        >
                            <h2 className="text-4xl font-bold mb-6">
                                Join us on our mission
                            </h2>
                            <p className="text-xl text-emerald-50 mb-8">
                                We're always looking for talented people who share our passion for innovation and user-centric design.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" className="bg-white text-white hover:bg-emerald-50 shadow-lg border-0">
                                    View Open Positions
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white transition-all"
                                    asChild
                                >
                                    <Link href="/contact">Contact Us</Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
