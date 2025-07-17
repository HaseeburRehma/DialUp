
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connect } from '../../../../../server/utils/db'
import Note from '../../../../../server/models/Note'
import { sendNoteNotification } from '../../../../../server/utils/mailer'
import User from 'server/models/User'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * PATCH /api/notes/:id
 */
export async function PATCH(req: NextRequest,
    context: { params: { id: string } }
) {
    const { id } = context.params

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const data = await req.json()
    const { text, audioUrls, callerName, callerEmail, callerLocation, callerAddress, callReason } = data

    await connect()
    const note = await Note.findOneAndUpdate(
        { _id: id, userId: session.user.id },
        { text, audioUrls, callerName, callerEmail, callerLocation, callerAddress, callReason },
        { new: true }
    )
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    // send update notifications
    const subject = `Note Updated by ${callerName || 'Caller'}`
    const html = `<p>The note has been updated:</p><pre>${note.text}</pre>`
    if (session.user.email) {
        await sendNoteNotification({ to: session.user.email, subject, html })
    }
    if (callerEmail) {
        await sendNoteNotification({ to: callerEmail, subject: 'Your note was updated', html })
    }

    return NextResponse.json(note)
}

/**
 * DELETE /api/notes/:id
 */
export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connect()
    const result = await Note.deleteOne({ _id: id, userId: session.user.id })
    if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // send deletion notification
    const subject = `Note Deleted`
    const html = `<p>Your note (ID: ${User.id}) was deleted.</p>`
    if (session.user.email) {
        await sendNoteNotification({ to: session.user.email, subject, html })
    }

    return NextResponse.json({ success: true })
}
