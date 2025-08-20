// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getBucket } from "@/lib/mongo"
import { Readable } from "stream"

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

    // Upload to GridFS
    const bucket = await getBucket()
    const filename = file.name || `audio-${Date.now()}.wav`
    const contentType = file.type || "audio/wav"

    const uploadStream = bucket.openUploadStream(filename, { 
      contentType,
      metadata: {
        uploadedAt: new Date(),
        originalSize: file.size,
        uploadIP: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      }
    })
    
    const readable = Readable.from(buffer)
    readable.pipe(uploadStream)

    return await new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        const fileId = uploadStream.id
        const idStr = fileId.toHexString?.() || fileId.toString()
        
        // Get the base URL more reliably
        const protocol = req.headers.get('x-forwarded-proto') || 
                        (req.url.includes('https') ? 'https' : 'http')
        const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'localhost:3000'
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
        
        const fileUrl = `${baseUrl}/api/uploads/${idStr}`
        
        console.log(`[Upload API] ✅ Upload successful - ID: ${idStr}, URL: ${fileUrl}`)
        
        resolve(
          NextResponse.json({
            id: idStr,
            url: fileUrl,
            filename,
            size: file.size,
            contentType
          })
        )
      })
      
      uploadStream.on("error", (err) => {
        console.error("[Upload API] ❌ Upload stream error:", err)
        reject(NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 }))
      })
    })

  } catch (err: any) {
    console.error("[Upload API] ❌ General upload error:", err)
    return NextResponse.json({ 
      error: `Upload failed: ${err.message}`,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}