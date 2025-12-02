import { notFound } from 'next/navigation'
import { connect } from '../../../../server/utils/db.js'
import Note from '../../../../server/models/Note.js'
import { formatDistanceToNow } from 'date-fns'
import { FileText, MapPin, Mail, User, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getSharedNote(token: string) {
    await connect()
    const note = await Note.findOne({ shareToken: token, isShared: true }).lean()
    if (!note) return null
    return JSON.parse(JSON.stringify(note))
}

export default async function SharedNotePage({ params }: { params: { token: string } }) {
    const note = await getSharedNote(params.token)

    if (!note) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                    {/* Header */}
                    <div className="bg-slate-900 px-6 py-8 sm:px-10">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <FileText className="h-6 w-6 text-blue-400" />
                                Shared Note
                            </h1>
                            <span className="text-slate-400 text-sm">
                                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
                            {note.callReason || 'No Subject'}
                        </h2>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-slate-50 px-6 py-4 sm:px-10 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <User className="h-5 w-5 text-slate-400" />
                            <span className="font-medium">{note.callerName || 'Unknown Caller'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail className="h-5 w-5 text-slate-400" />
                            <span>{note.callerEmail || 'No Email'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <MapPin className="h-5 w-5 text-slate-400" />
                            <span>{note.callerLocation || 'No Location'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 sm:px-10">
                        <div
                            className="prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: note.text }}
                        />

                        {note.summary && (
                            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    ✨ AI Summary
                                </h3>
                                <p className="text-blue-800 leading-relaxed">
                                    {note.summary}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 sm:px-10 border-t border-slate-200 text-center text-slate-500 text-sm">
                        Shared via Dialup VoiceAI
                    </div>
                </div>
            </div>
        </div>
    )
}
