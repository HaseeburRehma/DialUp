
// src/app/api/folders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { connect } from '../../../../server/utils/db.js'
import User from '../../../../server/models/User.js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connect()
        const user = await User.findById(token.id || token.sub)
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json(user.folders || ['General'])
    } catch (err) {
        console.error('GET /api/folders error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { name } = await req.json()
        if (!name) return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
        const folder = name

        await connect()
        const user = await User.findById(token.id || token.sub)
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (!user.folders.includes(folder)) {
            user.folders.push(folder)
            await user.save()
        }

        return NextResponse.json(user.folders)
    } catch (err) {
        console.error('POST /api/folders error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
