// src/app/api/voice/stream/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const encoder = new TextEncoder()

const stream = new ReadableStream({
  start(controller) {
    const interval = setInterval(() => {
      if (globalThis.__OMNIDIM_LAST_EVENT__) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(globalThis.__OMNIDIM_LAST_EVENT__)}\n\n`)
        )
        globalThis.__OMNIDIM_LAST_EVENT__ = null
      } else {
        controller.enqueue(encoder.encode(": keepalive\n\n"))
      }
    }, 2000)

    // clean up when client disconnects
    return () => clearInterval(interval)
  },
})


 return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  },
})

}
