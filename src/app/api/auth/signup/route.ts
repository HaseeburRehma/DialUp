// src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connect } from '../../../../../server/utils/db.js';
import User from '../../../../../server/models/User.js';
import { hashPassword } from '../../../../../server/utils/auth.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



export async function POST(req: NextRequest) {
  try {
    await connect()
    
    const { name, username, email, password, phone } = await req.json()
    
    // Validate required fields
    if (!name || !username || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email } , { phone }]
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
      phone,  // 🔑 Store phone number
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
          username: user.username,
          phone: user.phone  
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