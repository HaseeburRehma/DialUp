// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  // Delete JWT cookie
  const response = NextResponse.json({ success: true })
  response.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0), 
    path: '/',
  })
  return response
}
