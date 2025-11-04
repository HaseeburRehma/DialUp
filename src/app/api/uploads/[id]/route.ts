// src/app/api/uploads/[id]/route.ts
import { getBucket } from '@/lib/mongo'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;   // ✅ await params
  try {
    const bucket = await getBucket()
    const fileId = new ObjectId(id)
    const file = await bucket.find({ _id: fileId }).next()
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const range = req.headers.get('range')
    const start = range ? Number(range.replace(/bytes=/, '').split('-')[0]) : 0
    const end = file.length - 1
    const chunkSize = end - start + 1

    const stream = bucket.openDownloadStream(fileId, { start })
    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        'Content-Type': file.contentType || 'audio/wav',
        'Content-Length': String(chunkSize),
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
      },
    })
  } catch (err: any) {
    console.error('[Download Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
