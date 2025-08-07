import NextAuth from "next-auth"
import { authOptions } from "@/app/api/auth/authOptions" // adjust path if needed

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } // ✅ ONLY export GET and POST
