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
    const downloadStream = bucket.openDownloadStream(fileId)

    // ✅ Wrap Node.js stream in a web ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        downloadStream.on("data", (chunk) => controller.enqueue(chunk))
        downloadStream.on("end", () => controller.close())
        downloadStream.on("error", (err) => controller.error(err))
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": file.contentType || "audio/wav",
        "Content-Disposition": `inline; filename="${file.filename}"`,
      },
    })
  } catch (err: any) {
    console.error("❌ Download error:", err)
    return new Response(err.message, { status: 500 })
  }
}
