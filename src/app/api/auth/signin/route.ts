import { NextRequest, NextResponse } from 'next/server';
import { connect } from '../../../../../server/utils/db.js';
import User from '../../../../../server/models/User.js';
import { verifyPassword } from '../../../../../server/utils/auth.js';
import NextAuth from 'next-auth';
import { authOptions } from '../../../../../server/config/authOptions.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await connect()
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate credentials manually first (optional, since NextAuth will do it again)
    const user = await User.findOne({ username })
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    /**
     * Now delegate to NextAuth to create the session.
     * This uses the Credentials provider inside authOptions
     * so it sets the correct JWT cookie for getServerSession().
     */
    const handler = NextAuth(authOptions)
    return handler(req, NextResponse.next())
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
