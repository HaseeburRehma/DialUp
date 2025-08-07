import NextAuth from "next-auth"
import { authOptions } from "./../authOptions" // adjust path if needed

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
