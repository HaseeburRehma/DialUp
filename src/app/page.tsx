'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, FileText, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const features = [
  {
    icon: Mic,
    title: "Voice Recording",
    description: "Record multiple voice clips within a single note. Perfect for lectures, meetings, or quick thoughts."
  },
  {
    icon: FileText,
    title: "AI Transcription",
    description: "Automatic speech-to-text conversion with high accuracy. Edit and refine transcriptions as needed."
  },
  {
    icon: Sparkles,
    title: "AI Enhancement",
    description: "Optional post-processing to improve transcription clarity, fix grammar, and enhance your notes."
  }
]

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-sky-500/10">
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
              Voice Notes with <br />
              <span className="text-primary">AI Superpowers</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-16">
              Record, transcribe, and enhance your notes with AI assistance
            </p>

            <Link href={session ? '/notes' : '/auth/signup'}>
              <Button size="lg">
                {session ? 'View Your Notes' : 'Create Your First Note'}
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <section id="features">
            <h2 className="text-2xl md:text-4xl font-bold mb-12 text-center">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <feature.icon className="text-primary size-8" />
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}