// src/app/api/upload/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getBucket } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Upload API] Attempting to serve file: ${params.id}`)
    
    const bucket = await getBucket()
    
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      console.error(`[Upload API] Invalid ObjectId format: ${params.id}`)
      return new Response("Invalid file ID format", { status: 400 })
    }
    
    const fileId = new ObjectId(params.id)

    // Check if file exists
    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files.length) {
      console.error(`[Upload API] File not found: ${params.id}`)
      return new Response("File not found", { status: 404 })
    }

    const file = files[0]
    console.log(`[Upload API] Serving file: ${file.filename}, type: ${file.contentType}`)

    const downloadStream = bucket.openDownloadStream(fileId)

    // Enhanced error handling for stream
    return new Promise<Response>((resolve, reject) => {
      const chunks: Buffer[] = []
      
      downloadStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      downloadStream.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks)
          const response = new Response(buffer, {
            headers: {
              "Content-Type": file.contentType || "audio/wav",
              "Content-Length": buffer.length.toString(),
              "Content-Disposition": `inline; filename="${file.filename}"`,
              "Cache-Control": "public, max-age=31536000",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET",
              "Accept-Ranges": "bytes"
            },
          })
          resolve(response)
        } catch (err: any) {
          console.error("[Upload API] Error creating response:", err)
          reject(new Response("Error serving file", { status: 500 }))
        }
      })
      
      downloadStream.on("error", (err: any) => {
        console.error("[Upload API] Stream error:", err)
        reject(new Response(`Stream error: ${err.message}`, { status: 500 }))
      })
    })
    
  } catch (err: any) {
    console.error("[Upload API] General error:", err)
    return new Response(`Server error: ${err.message}`, { status: 500 })
  }
}