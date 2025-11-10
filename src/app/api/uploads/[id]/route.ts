// src/app/api/uploads/[id]/route.ts
import { getBucket } from '@/lib/mongo'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const bucket = await getBucket()
    const fileId = new ObjectId(id)
    const file = await bucket.find({ _id: fileId }).next()

    if (!file || typeof file.length !== 'number') {
      return NextResponse.json({ error: 'File not ready or not found' }, { status: 404 })
    }

    const fileSize = file.length
    const range = req.headers.get('range')

    // Parse range header
    let start = 0
    let end = fileSize - 1

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      start = parseInt(parts[0], 10)
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        })
      }
    }

    const chunkSize = end - start + 1
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const nodeStream = bucket.openDownloadStream(fileId, { start, end: end + 1 })
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', chunk => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', err => controller.error(err))
      },
    })

    return new NextResponse(webStream, {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': file.contentType || 'audio/wav',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize.toString(),
      },
    })


  } catch (err: any) {
    console.error('[Download Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}