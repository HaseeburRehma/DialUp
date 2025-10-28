// server/utils/requireAuth.js
import { getToken } from "next-auth/jwt"

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null

  return {
    id: token.id,
    email: token.email,
    role: token.role,
    plan: token.plan,
  }
}
