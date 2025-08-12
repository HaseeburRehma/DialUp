import type { AuthOptions, SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connect } from "../../../../server/utils/db"
import User from "../../../../server/models/User"
import { verifyPassword } from "../../../../server/utils/auth"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

export const authOptions: AuthOptions = {
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
        try {
          if (!credentials) return null
          await connect()
          const user = await User.findOne({ username: credentials.username })
          if (!user) return null
          const valid = await verifyPassword(credentials.password, user.password)
          if (!valid) return null
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            plan: user.plan,
          };

        } catch (err) {
          console.error('Authorize error:', err)
          return null
        }
      }

    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const typedUser = user as AdapterUser & { role?: string; plan?: string }

      if (typedUser?.id) {
        token.id = typedUser.id
        token.role = typedUser.role
        token.plan = typedUser.plan
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.plan = token.plan as string
      return session
    },
  },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
}
