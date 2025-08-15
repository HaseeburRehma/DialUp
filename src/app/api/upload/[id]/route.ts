// src/app/api/uploads/[id]/route.ts
import { NextRequest } from "next/server"
import { getBucket } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bucket = await getBucket()
    const fileId = new ObjectId(params.id)

    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files.length) {
      return new Response("File not found", { status: 404 })
    }

    const file = files[0]
    const stream = bucket.openDownloadStream(fileId)

    return new Response(stream as any, {
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.filename}"`,
      },
    })
  } catch (err: any) {
    console.error("❌ Download error:", err)
    return new Response(err.message, { status: 500 })
  }
}
