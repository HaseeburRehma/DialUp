// src/app/api/auth/debug-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return NextResponse.json({ user: payload })
  } catch (err) {
    console.error('Session verify error:', err)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
