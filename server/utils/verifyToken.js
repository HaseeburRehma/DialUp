// server/utils/verifyToken.js
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function verifyUserToken(req) {
  try {
    let token;

    // 1️⃣ Try to read cookie from Next.js App Router context (async now!)
    try {
      const cookieStore = await cookies(); // ✅ must await
      token =
        cookieStore.get("next-auth.session-token")?.value ||
        cookieStore.get("__Secure-next-auth.session-token")?.value;
    } catch {
      // 2️⃣ Fallback for legacy requests or Express
      if (req?.cookies?.get)
        token = req.cookies.get("next-auth.session-token")?.value;
      else if (req?.cookies?.token) token = req.cookies.token;
    }

    if (!token) {
      console.warn("⚠️ No session token found in cookies");
      return null;
    }

    // 3️⃣ Verify it
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.sub,
      username: payload.name,
      email: payload.email,
    };
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
}
