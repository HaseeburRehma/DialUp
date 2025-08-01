// src/app/api/server/auth/signup/route.ts
import { NextResponse } from 'next/server'
import { connect } from "../../../../../server/utils/db"
import User from "../../../../../server/models/User"
import { hashPassword } from '../../../../../server/utils/auth'

export async function POST(request: Request) {
    try {
        const { name, username, email, password } = await request.json()

        await connect()
        const hashed = await hashPassword(password)

        const user = await User.create({ name, username, email, password: hashed })

        return NextResponse.json({
            message: 'Signup successful' user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                plan: user.plan,
            }
        }, { status: 201 })
    } catch (err: any) {
        // handle duplicate key
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Username or email already in use' }, { status: 400 })
        }
        console.error(err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
