// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

export const config = {
  matcher: [
    '/notes/:path*',
    '/dialer/:path*',
    '/answerai/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}
