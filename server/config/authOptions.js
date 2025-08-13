const GoogleProvider = require("next-auth/providers/google").default || require("next-auth/providers/google");
const CredentialsProvider = require("next-auth/providers/credentials").default || require("next-auth/providers/credentials");
const { connect } = require("../utils/db");
const User = require("../models/User");
const { verifyPassword } = require("../utils/auth");

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        await connect();
        const user = await User.findOne({ username: credentials.username });
        if (!user?.password) return null;
        const valid = await verifyPassword(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user._id.toString(),
          name: user.name ?? user.username,
          email: user.email ?? "",
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.plan = token.plan;
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

module.exports = { authOptions };