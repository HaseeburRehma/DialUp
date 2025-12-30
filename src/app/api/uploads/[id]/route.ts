// src/app/api/uploads/[id]/route.ts
import { downloadFileRange } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const range = req.headers.get('range')
    let start: number | undefined
    let end: number | undefined

    // Parse range header if provided
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      start = parseInt(parts[0], 10)
      end = parts[1] ? parseInt(parts[1], 10) : undefined
    }

    // Download with automatic MongoDB/filesystem fallback
    const result = await downloadFileRange(id, start, end)

    if (!result) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Validate range
    if (start !== undefined && (start >= result.total || result.end >= result.total || start > result.end)) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${result.total}`,
        },
      })
    }

    // Convert Node stream to Web stream if needed
    let webStream: ReadableStream
    if ('getReader' in result.stream) {
      webStream = result.stream as ReadableStream
    } else {
      const nodeStream = result.stream as NodeJS.ReadableStream
      webStream = new ReadableStream({
        start(controller) {
          nodeStream.on('data', chunk => controller.enqueue(chunk))
          nodeStream.on('end', () => controller.close())
          nodeStream.on('error', err => controller.error(err))
        },
      })
    }

    console.log(`[Download API] ✅ Serving ${id} from ${result.storage}: ${result.start}-${result.end}/${result.total}`)

    return new NextResponse(webStream, {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': result.contentType,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${result.start}-${result.end}/${result.total}`,
        'Content-Length': result.size.toString(),
        'X-Storage-Type': result.storage,
      },
    })

  } catch (err: any) {
    console.error('[Download Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}