// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/storage"
import { connect } from '../../../../server/utils/db.js'
import Call from '../../../../server/models/Call'

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  try {
    console.log("[Upload API] Processing file upload...")

    const form = await req.formData()
    const file = form.get("file") as File
    if (!file) {
      console.error("[Upload API] No file provided")
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    console.log(`[Upload API] Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload with automatic MongoDB/filesystem fallback
    const filename = file.name || `audio-${Date.now()}.wav`
    const contentType = file.type || "audio/wav"

    const result = await uploadFile(buffer, filename, contentType, {
      originalSize: file.size,
      uploadIP: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    })

    // Build public URL
    const publicUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL

    let baseUrl: string
    if (publicUrl) {
      baseUrl = publicUrl
      console.log(`[Upload API] Using public URL: ${baseUrl}`)
    } else {
      const protocol = req.headers.get('x-forwarded-proto') || (req.url.includes('https') ? 'https' : 'http')
      const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'localhost:3000'
      baseUrl = `${protocol}://${host}`
      console.log(`[Upload API] Using dynamic URL: ${baseUrl}`)
    }

    const fileUrl = `${baseUrl}${result.url}`

    console.log(`[Upload API] ✅ Upload successful - ID: ${result.id}, URL: ${fileUrl}, Storage: ${result.storage}`)

    // Attach to Call if metadata provided
    const callSid = form.get('CallSid') as string
    const callId = form.get('callId') as string
    if (callSid || callId) {
      try {
        await connect()
        const filter = callId ? { _id: callId } : { 'metadata.callSid': callSid }
        await Call.findOneAndUpdate(
          filter,
          { $push: { recordings: fileUrl } },
          { new: true }
        )
        console.log(`🎧 Attached recording to Call ${callSid || callId}`)
      } catch (e) {
        console.error('⚠️ Failed to attach recording to Call:', e)
      }
    }

    return NextResponse.json({
      id: result.id,
      url: fileUrl,
      filename,
      size: file.size,
      contentType,
      storage: result.storage
    })

  } catch (err: any) {
    console.error("[Upload API] ❌ General upload error:", err)
    return NextResponse.json({
      error: `Upload failed: ${err.message}`,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}