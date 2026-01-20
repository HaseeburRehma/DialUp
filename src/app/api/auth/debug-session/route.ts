// src/app/api/auth/debug-session/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "server/config/authOptions"

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return Response.json({ user: null }, { status: 401 })
    }

    return Response.json({ user: session.user })
}
