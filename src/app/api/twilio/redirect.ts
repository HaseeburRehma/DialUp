import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { callSid, url } = req.body

  try {
    await client.calls(callSid).update({ url, method: 'POST' })
    res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('❌ Twilio redirect error:', err)
    res.status(500).json({ error: err.message })
  }
}
