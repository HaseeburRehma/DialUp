// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get("file") as File
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const uploadsDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  const ext = file.type.split("/")[1] || "webm"
  const filename = `audio-${Date.now()}.${ext}`
  const filepath = join(uploadsDir, filename)
  await writeFile(filepath, buffer)

  // Next.js will serve from /public automatically
  return NextResponse.json({ url: `/uploads/${filename}` })
}
