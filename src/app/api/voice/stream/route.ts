import { NextResponse } from "next/server"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        try {
          if (globalThis.__OMNIDIM_LAST_EVENT__) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify(globalThis.__OMNIDIM_LAST_EVENT__)}\n\n`
              )
            )
            globalThis.__OMNIDIM_LAST_EVENT__ = null
          } else {
            controller.enqueue(encoder.encode(": keepalive\n\n"))
          }
        } catch (err) {
          clearInterval(interval)
          console.warn(
            "❌ SSE stream closed, stopping interval:",
            err instanceof Error ? err.message : String(err)
          )
        }
      }, 2000)
    },

    cancel() {
      console.log("🔌 SSE connection closed by client")
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
