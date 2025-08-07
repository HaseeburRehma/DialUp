import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      id?: string
      plan?: string
    }
  }

  interface User {
    role?: string
    id?: string
    plan?: string
  }
}
