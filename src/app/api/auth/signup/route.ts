import { NextRequest, NextResponse } from 'next/server'
import { connect } from '../../../../../server/utils/db'
import User from '../../../../../server/models/User'
import { hashPassword } from '../../../../../server/utils/auth'
import { signIn } from 'next-auth/react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await connect()
    
    const { name, username, email, password } = await req.json()
    
    // Validate required fields
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      plan: 'free'
    })
    
    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username
        }
      },
      { status: 201 }
    )
    
  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}