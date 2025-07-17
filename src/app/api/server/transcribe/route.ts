// app/api/server/transcribe/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join, dirname, resolve } from 'path'
import { spawn } from 'child_process'
import { existsSync } from 'fs'

// Disable Next’s built-in body parser so we can handle multipart
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
    // 1) parse formData
    const formData = await req.formData()
    const filePart = formData.get('audio') as File | null
    if (!filePart) {
        return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
    }

    // 2) write temp file
    const buffer = Buffer.from(await filePart.arrayBuffer())
    const ext = filePart.type.split('/')[1] || 'webm'
    const tmpPath = join(tmpdir(), `voice-${Date.now()}.${ext}`)
    await writeFile(tmpPath, buffer)

    // 3) python & script
    const windowsVenv1 = resolve(process.cwd(), 'server', '.venv', 'Scripts', 'python.exe')
    const windowsVenv2 = resolve(process.cwd(), 'server', 'venv', 'Scripts', 'python.exe')
    let pythonExec: string

    if (process.platform === 'win32') {
        if (existsSync(windowsVenv1)) {
            pythonExec = windowsVenv1
        } else if (existsSync(windowsVenv2)) {
            pythonExec = windowsVenv2
        } else {
            // fallback to whatever 'python' on your PATH points to
            pythonExec = 'python'
        }
    } else {
        pythonExec = 'python3'
    }

    const scriptPath = resolve(process.cwd(), 'server', 'utils', 'audiototext.py')

    // 4) build a PATH so ffmpeg/ffprobe are found
    const ffmpegExe = process.env.FFMPEG_PATH || resolve(process.cwd(), 'server', 'utils', 'ffmpeg.exe')
    const ffprobeExe = process.env.FFPROBE_PATH || resolve(process.cwd(), 'server', 'utils', 'ffprobe.exe')
    const ffmpegDir = dirname(ffmpegExe)
    const ffprobeDir = dirname(ffprobeExe)
    const newPath = [ffmpegDir, ffprobeDir, process.env.PATH]
        .filter(Boolean)
        .join(process.platform === 'win32' ? ';' : ':')

    let transcript = ''
    let stderr = ''

    try {
        // 5) spawn Python
        const py = spawn(pythonExec, [
            scriptPath,
            tmpPath,
            '--task', 'transcribe',
            '--model', 'tiny'
        ], {
            env: { ...process.env, PATH: newPath },
            shell: false
        })

        // 6) collect stdout
        for await (const chunk of py.stdout) {
            transcript += chunk.toString()
        }

        // 7) collect stderr
        for await (const chunk of py.stderr) {
            stderr += chunk.toString()
        }

        // 8) wait for exit
        const code = await new Promise<number>(r => py.on('close', r))
        if (code !== 0) {
            console.error('⛔ Whisper stderr:', stderr)
            return NextResponse.json(
                { error: `Python exited with code ${code}`, details: stderr.trim() },
                { status: 502 }
            )
        }

        // 9) success
        // Nine) *new* success path:
        return NextResponse.json(
            { text: transcript.trim() },
            { status: 200 }
        )

    } catch (err: any) {
        console.error('⛔ Transcription error:', err)
        return NextResponse.json(
            { error: err.message || 'Transcription failed' },
            { status: 502 }
        )

    } finally {
        // 10) cleanup
        await unlink(tmpPath).catch(() => { })
    }
}
