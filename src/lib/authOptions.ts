import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connect } from "../../server/utils/db"
import User from "../../server/models/User"
import { verifyPassword } from "../../server/utils/auth"
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
          if (!user?.password) return null

          const valid = await verifyPassword(credentials.password, user.password)
          if (!valid) return null

          return {
            id: user._id.toString(),
            name: user.name ?? user.username,
            email: user.email ?? "",
            role: user.role,
            plan: user.plan,
          }
        } catch (e) {
          console.error("credentials authorize error:", e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.plan = (user as any).plan
      }
      return token
    },
    async session({ session, token }) {
      (session.user as any).id = token.id as string
        ; (session.user as any).role = token.role as string
        ; (session.user as any).plan = token.plan as string
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('signIn callback', { user, account, credentials });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('redirect callback', { url, baseUrl });
      return baseUrl;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
} as const
