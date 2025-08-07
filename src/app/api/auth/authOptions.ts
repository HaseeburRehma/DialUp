import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connect } from "../../../../server/utils/db"
import User from "../../../../server/models/User"
import { verifyPassword } from "../../../../server/utils/auth"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"

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
        await connect()
        const user = await User.findOne({ username: credentials.username })
        if (!user) return null
        const valid = await verifyPassword(user.password, credentials.password)
        if (!valid) return null
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id: string; role: string; plan: string } }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role
        token.plan = user.plan
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.plan = token.plan as string
      return session
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
}
