// src/app/api/sip/config/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'server/config/authOptions.js'

// In a real implementation, you'd store this in a database
let sipConfigs: Record<string, any> = {}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userConfig = sipConfigs[session.user.id] || {}
    
    return NextResponse.json({
      domain: userConfig.domain || '',
      websocketUrl: userConfig.websocketUrl || '',
      username: userConfig.username || '',
      displayName: userConfig.displayName || session.user.name || ''
    })
  } catch (error: any) {
    console.error('Get SIP config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain, websocketUrl, username, password, displayName } = await req.json()
    
    if (!domain || !websocketUrl || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Store configuration (in production, use proper database with encryption)
    sipConfigs[session.user.id] = {
      domain,
      websocketUrl,
      username,
      password, // Should be encrypted in production
      displayName
    }

    return NextResponse.json({ message: 'SIP configuration saved successfully' })
  } catch (error: any) {
    console.error('Save SIP config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}