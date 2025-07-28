// pages/api/settings.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import Settings from '../../../server/models/Settings'
import { connect } from '../../../server/utils/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

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
