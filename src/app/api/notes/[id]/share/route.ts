import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connect } from '../../../../../../server/utils/db.js'
import Note from '../../../../../../server/models/Note.js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: any) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connect()

        const shareToken = crypto.randomBytes(16).toString('hex')

        const note = await Note.findOneAndUpdate(
            { _id: params.id, userId: token.id },
            { shareToken, isShared: true },
            { new: true }
        )

        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

        return NextResponse.json({
            shareToken,
            isShared: true,
            shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/shared/${shareToken}`
        })
    } catch (err) {
        console.error('POST /api/notes/[id]/share error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: any) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connect()

        const note = await Note.findOneAndUpdate(
            { _id: params.id, userId: token.id },
            { shareToken: null, isShared: false },
            { new: true }
        )

        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

        return NextResponse.json({ isShared: false })
    } catch (err) {
        console.error('DELETE /api/notes/[id]/share error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
