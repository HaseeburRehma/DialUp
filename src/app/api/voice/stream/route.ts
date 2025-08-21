// src/app/api/voice/stream/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let lastSent: any = null

      // Poll Omnidim events every 1s
      const interval = setInterval(() => {
        const evt = (globalThis as any).__OMNIDIM_LAST_EVENT__
        if (evt && evt !== lastSent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`))
          lastSent = evt
        }
      }, 1000)

      controller.enqueue(encoder.encode('retry: 1000\n\n'))

      return () => clearInterval(interval)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
