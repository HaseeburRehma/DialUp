// pages/api/settings.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth"

import Settings from '../../../server/models/Settings.js'
import { connect } from '../../../server/utils/db.js'
import { NextResponse } from 'next/server.js'
import { authOptions } from 'server/config/authOptions.js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions)
   if (!session?.user?.email) {
     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
   }
 
  await connect()
  const key = session.user.email

  if (req.method === 'GET') {
    let settings = await Settings.findOne({ userEmail: key })
    if (!settings) settings = await Settings.create({ userEmail: key })
    return res.status(200).json(settings)
  }

  if (req.method === 'PATCH') {
    const updates = req.body
    const settings = await Settings.findOneAndUpdate(
      { userEmail: key },
      updates,
      { new: true, upsert: true }
    )
    return res.status(200).json(settings)
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
