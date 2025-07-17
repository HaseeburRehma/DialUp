// src/app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connect } from "../../../../../server/utils/db"
import User from "../../../../../server/models/User"
import { verifyPassword } from "../../../../../server/utils/auth"
import { signInSchema } from "../../../../../server/schemas/auth.schema"


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        console.log("authorize() called with:", credentials)
        await connect()
        const user = await User.findOne({ username: credentials.username })
        console.log("DB returned user:", user)
        if (!user) {
          console.log("→ No user found, returning null")
          return null
        }
        const valid = await verifyPassword(user.password, credentials.password)
        console.log("Password valid?", valid)
        if (!valid) {
          console.log("→ Invalid password, returning null")
          return null
        }
        console.log("→ Success! Returning user.")
        return { id: user._id.toString(), name: user.name, email: user.email }

      },
    }),
  ],
   callbacks: {
    async jwt({ token, user }) {
      // on first sign in, persist the Mongo _id into the token
      if (user && user.id) token.id = user.id
      return token
    },
    async session({ session, token }) {
      // now session.user.id === the Mongo _id
      session.user.id = token.id
      return session
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
