// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getBucket } from "@/lib/mongo"
import { Readable } from "stream"

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to GridFS
    const bucket = await getBucket()
    const filename = file.name || `audio-${Date.now()}`
    const contentType = file.type || "application/octet-stream"

    const uploadStream = bucket.openUploadStream(filename, { contentType })
    const readable = Readable.from(buffer)
    readable.pipe(uploadStream)

    return await new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        resolve(NextResponse.json({ id: uploadStream.id.toString() }))
      })
      uploadStream.on("error", (err) => {
        reject(NextResponse.json({ error: err.message }, { status: 500 }))
      })
    })

  } catch (err: any) {
    console.error("❌ Upload error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
