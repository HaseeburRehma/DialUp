// src/app/api/auth/signin/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db.js'
import User from '../../../../../server/models/User.js'
import { verifyPassword } from '../../../../../server/utils/auth.js'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await connect()
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const user = await User.findOne({ username })
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Create NextAuth-like JWT token
    const token = await new SignJWT({ sub: user._id.toString(), name: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET))

    // Create the response and set the cookie
    const res = NextResponse.json({ success: true })
    res.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return res
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
