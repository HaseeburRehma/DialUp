// src/lib/storage.ts
import { getBucket } from './mongo'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'
import { ObjectId } from 'mongodb'
import { logger, logError } from './logger'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    logger.info('[Storage] Created uploads directory')
}

export interface UploadResult {
    id: string
    url: string
    storage: 'mongodb' | 'filesystem'
}

/**
 * Upload file with automatic fallback to filesystem if MongoDB fails
 */
export async function uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    metadata?: Record<string, any>
): Promise<UploadResult> {
    // Try MongoDB first
    try {
        const bucket = await getBucket()

        const uploadStream = bucket.openUploadStream(filename, {
            contentType,
            metadata: {
                ...metadata,
                uploadedAt: new Date(),
                storage: 'mongodb'
            }
        })

        const readable = Readable.from(buffer)

        return await new Promise((resolve, reject) => {
            readable.pipe(uploadStream)

            uploadStream.on('finish', () => {
                const fileId = uploadStream.id
                const idStr = fileId.toHexString?.() || fileId.toString()

                logger.info(`[Storage] ✅ Uploaded to MongoDB: ${idStr}`)
                resolve({
                    id: idStr,
                    url: `/api/uploads/${idStr}`,
                    storage: 'mongodb'
                })
            })

            uploadStream.on('error', (err) => {
                logError('[Storage] MongoDB upload failed', err)
                reject(err)
            })
        })

    } catch (mongoError: any) {
        // MongoDB failed, fall back to file system
        logError('[Storage] MongoDB unavailable, using filesystem fallback', mongoError)

        try {
            const fileId = new ObjectId().toHexString()
            const filePath = path.join(UPLOADS_DIR, `${fileId}.wav`)

            await fs.promises.writeFile(filePath, buffer)

            // Save metadata
            const metaPath = path.join(UPLOADS_DIR, `${fileId}.json`)
            await fs.promises.writeFile(metaPath, JSON.stringify({
                filename,
                contentType,
                size: buffer.length,
                uploadedAt: new Date().toISOString(),
                storage: 'filesystem',
                ...metadata
            }, null, 2))

            logger.info(`[Storage] ✅ Uploaded to filesystem: ${fileId}`)

            return {
                id: fileId,
                url: `/api/uploads/${fileId}`,
                storage: 'filesystem'
            }

        } catch (fsError: any) {
            logError('[Storage] Filesystem upload also failed', fsError)
            throw new Error(`All storage methods failed: MongoDB (${mongoError.message}), Filesystem (${fsError.message})`)
        }
    }
}

/**
 * Download file - tries MongoDB first, then filesystem
 */
export async function downloadFile(id: string): Promise<{
    stream: ReadableStream | NodeJS.ReadableStream
    size: number
    contentType: string
    storage: 'mongodb' | 'filesystem'
} | null> {
    // Try MongoDB first
    try {
        const bucket = await getBucket()
        const fileId = new ObjectId(id)
        const file = await bucket.find({ _id: fileId }).next()

        if (file && typeof file.length === 'number') {
            logger.info(`[Storage] ✅ Found in MongoDB: ${id}`)

            return {
                stream: bucket.openDownloadStream(fileId),
                size: file.length,
                contentType: file.contentType || 'audio/wav',
                storage: 'mongodb'
            }
        }
    } catch (mongoError) {
        logError('[Storage] MongoDB download failed, trying filesystem', mongoError)
    }

    // Try filesystem
    try {
        const filePath = path.join(UPLOADS_DIR, `${id}.wav`)
        const metaPath = path.join(UPLOADS_DIR, `${id}.json`)

        if (fs.existsSync(filePath)) {
            const stats = await fs.promises.stat(filePath)

            let contentType = 'audio/wav'
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'))
                contentType = meta.contentType || contentType
            }

            logger.info(`[Storage] ✅ Found in filesystem: ${id}`)

            return {
                stream: fs.createReadStream(filePath),
                size: stats.size,
                contentType,
                storage: 'filesystem'
            }
        }
    } catch (fsError) {
        logError('[Storage] Filesystem download also failed', fsError)
    }

    logger.info(`[Storage] ❌ File not found in any storage: ${id}`)
    return null
}

/**
 * Download file with range support (for audio streaming)
 */
export async function downloadFileRange(
    id: string,
    start?: number,
    end?: number
): Promise<{
    stream: ReadableStream | NodeJS.ReadableStream
    size: number
    contentType: string
    start: number
    end: number
    total: number
    storage: 'mongodb' | 'filesystem'
} | null> {
    // Try MongoDB first
    try {
        const bucket = await getBucket()
        const fileId = new ObjectId(id)
        const file = await bucket.find({ _id: fileId }).next()

        if (file && typeof file.length === 'number') {
            const fileSize = file.length
            const actualStart = start || 0
            const actualEnd = end !== undefined ? end : fileSize - 1

            logger.info(`[Storage] ✅ Range request MongoDB: ${id} (${actualStart}-${actualEnd}/${fileSize})`)

            return {
                stream: bucket.openDownloadStream(fileId, {
                    start: actualStart,
                    end: actualEnd + 1
                }),
                size: actualEnd - actualStart + 1,
                contentType: file.contentType || 'audio/wav',
                start: actualStart,
                end: actualEnd,
                total: fileSize,
                storage: 'mongodb'
            }
        }
    } catch (mongoError) {
        logError('[Storage] MongoDB range download failed, trying filesystem', mongoError)
    }

    // Try filesystem with range
    try {
        const filePath = path.join(UPLOADS_DIR, `${id}.wav`)
        const metaPath = path.join(UPLOADS_DIR, `${id}.json`)

        if (fs.existsSync(filePath)) {
            const stats = await fs.promises.stat(filePath)
            const fileSize = stats.size
            const actualStart = start || 0
            const actualEnd = end !== undefined ? end : fileSize - 1

            let contentType = 'audio/wav'
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'))
                contentType = meta.contentType || contentType
            }

            logger.info(`[Storage] ✅ Range request filesystem: ${id} (${actualStart}-${actualEnd}/${fileSize})`)

            return {
                stream: fs.createReadStream(filePath, { start: actualStart, end: actualEnd }),
                size: actualEnd - actualStart + 1,
                contentType,
                start: actualStart,
                end: actualEnd,
                total: fileSize,
                storage: 'filesystem'
            }
        }
    } catch (fsError) {
        logError('[Storage] Filesystem range download also failed', fsError)
    }

    return null
}
