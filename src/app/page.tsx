// src/app/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { InteractiveBackground, HeroBackground } from '@/components/ui/interactive-background'
import { IconWave } from '@/components/ui/icon-wave'
import { StickyScroll } from '@/components/ui/sticky-scroll'
import { ArrowRight, Terminal, Code, Cpu, Globe, Mic, Sparkles, FolderOpen, GraduationCap, Briefcase, Users, BookOpen, Headphones, MessageSquare } from 'lucide-react'

const voiceAIContent = [
  {
    title: "Voice Recording",
    description:
      "Record multiple voice clips within a single note. Perfect for lectures, meetings, or quick thoughts on the go. Capture your ideas instantly with high-quality audio recording.",
    image: "/images/voice-recording.jpg",
  },
  {
    title: "AI Transcription",
    description:
      "Automatic speech-to-text conversion with high accuracy. Edit and refine transcriptions as needed. Our AI understands context and technical terminology for precise results.",
    image: "/images/ai-transcription.png",
  },
  {
    title: "AI Enhancement",
    description:
      "Optional post-processing to improve transcription clarity, fix grammar, and enhance your notes automatically. Transform raw transcripts into polished, professional documents.",
    image: "/images/ai-enhancement.jpg",
  },
  {
    title: "Smart Organization",
    description:
      "Automatically organize and categorize your voice notes with AI-powered tagging and search. Find any note instantly with intelligent semantic search across all your recordings.",
    image: "/images/smart-organization.avif",
  },
]

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Antigravity Style with Interactive Background */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#fafbff] pt-20">

          <HeroBackground />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">

              {/* Brand Mark */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="text-green-500 font-bold text-xl">V</span> Vhisper AI
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900 leading-[1.1]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transform your voice
                <br />
                into intelligent notes
              </motion.h1>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  asChild
                >
                  <Link href={session ? '/notes' : '/auth/signup'}>
                    {session ? 'Go to Dashboard' : 'Signup Now'}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg border-slate-200 hover:bg-slate-50 text-slate-900 transition-all duration-300"
                >
                  Explore use cases
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Wave Section */}
        <section className="py-12 overflow-hidden">
          <div className="container mx-auto px-4 mb-12 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-medium leading-tight text-slate-900">
              Vhisper is your AI-powered voice note platform, transforming conversations into searchable, actionable insights.
            </h2>
          </div>
          <IconWave />
        </section>

        {/* Features Section - Sticky Scroll */}
        <section className=" bg-white pb-10">
          <div className="container mx-auto px-4">
            <StickyScroll content={voiceAIContent} />
          </div>
        </section>

        {/* How It Works Section - 3D Flip Cards */}
        <section className="py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Three simple steps to transform your voice into organized, searchable notes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Step 1 - Flip Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="h-[400px] perspective-1000"
              >
                <div className="relative w-full h-full group preserve-3d transition-transform duration-700 hover:rotate-y-180">
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 h-full flex flex-col justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-bold text-blue-600 mb-2">STEP 1</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4">Record</h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        Simply hit record and speak naturally. Capture lectures, meetings, interviews, or personal thoughts.
                      </p>
                      <p className="text-sm text-blue-500 font-medium">Hover to see more →</p>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                      <div className="flex-1 flex flex-col">
                        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-white/10">
                          <img
                            src="/images/voice-recording.jpg"
                            alt="Voice Recording"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-3">Key Features</h4>
                        <ul className="space-y-2 text-white/90 text-sm flex-1">
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Crystal-clear audio quality</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Multiple recordings per note</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Works offline & on-the-go</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 - Flip Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-[400px] perspective-1000"
              >
                <div className="relative w-full h-full group preserve-3d transition-transform duration-700 hover:rotate-y-180">
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 h-full flex flex-col justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-bold text-indigo-600 mb-2">STEP 2</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4">Transcribe</h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        Our AI instantly converts your speech to text with industry-leading accuracy.
                      </p>
                      <p className="text-sm text-indigo-500 font-medium">Hover to see more →</p>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                      <div className="flex-1 flex flex-col">
                        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-white/10">
                          <img
                            src="/images/ai-transcription.png"
                            alt="AI Transcription"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-3">AI-Powered</h4>
                        <ul className="space-y-2 text-white/90 text-sm flex-1">
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Real-time transcription</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Technical term recognition</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Easy editing & refinement</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 - Flip Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-[400px] perspective-1000"
              >
                <div className="relative w-full h-full group preserve-3d transition-transform duration-700 hover:rotate-y-180">
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 h-full flex flex-col justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                        <FolderOpen className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-bold text-purple-600 mb-2">STEP 3</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4">Organize</h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        AI automatically tags and categorizes your notes. Search across all recordings instantly.
                      </p>
                      <p className="text-sm text-purple-500 font-medium">Hover to see more →</p>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                      <div className="flex-1 flex flex-col">
                        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-white/10">
                          <img
                            src="/images/ai-enhancement.jpg"
                            alt="Smart Organization"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-3">Smart Search</h4>
                        <ul className="space-y-2 text-white/90 text-sm flex-1">
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Auto-categorization & tagging</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Semantic search across notes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-white flex-shrink-0">✓</span>
                            <span>Find anything instantly</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Perfect For Every Scenario
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From students to professionals, Vhisper adapts to your unique needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Use Case 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 hover:shadow-xl transition-all duration-300 border border-blue-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Students</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Never miss a lecture detail. Record classes, get instant transcripts, and create searchable study materials effortlessly.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 hover:shadow-xl transition-all duration-300 border border-purple-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Professionals</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Capture meeting notes, client calls, and brainstorming sessions. Stay organized and never forget important action items.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 3 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 hover:shadow-xl transition-all duration-300 border border-green-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Teams</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Collaborate seamlessly with shared voice notes. Keep everyone aligned with searchable team knowledge bases.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 4 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-red-50 p-6 hover:shadow-xl transition-all duration-300 border border-orange-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Researchers</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Document interviews, field notes, and observations. Organize research data with AI-powered categorization and insights.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 5 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 p-6 hover:shadow-xl transition-all duration-300 border border-cyan-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Content Creators</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Record podcast ideas, video scripts, and creative concepts. Transform voice memos into polished content drafts.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 6 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-6 hover:shadow-xl transition-all duration-300 border border-violet-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Journalists</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Record interviews and press conferences. Get accurate transcripts instantly and extract key quotes with ease.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Dark Download Section */}
        <section className="relative py-32 bg-black overflow-hidden text-white items-center justify-center ">
          <HeroBackground />

          <InteractiveBackground className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]" />
          </InteractiveBackground>

          <div className="container mx-auto px-4 relative z-10  items-center justify-center ">
            <div className="max-w-4xl">
              <h2 className="text-5xl md:text-6xl font-bold mb-12 tracking-tight">
                Ready to Revolutionize  <br />
                Your Note-Taking?
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg bg-white text-black hover:bg-gray-200 transition-all duration-300"
                  asChild
                >
                  <Link href={session ? '/notes' : '/auth/signup'}>
                    {session ? 'Go to Dashboard' : 'SignUp Now'}
                  </Link>

                </Button>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}