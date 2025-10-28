// server/utils/verifyToken.js
import { getToken } from "next-auth/jwt"

export async function verifyUserToken(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      console.warn("⚠️ No valid session token")
      return null
    }

    return {
      id: token.id,
      email: token.email,
      role: token.role,
      plan: token.plan,
    }
  } catch (err) {
    console.error("❌ Token verification failed:", err)
    return null
  }
}
