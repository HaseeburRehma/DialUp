// server/utils/verifyToken.js
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function verifyUserToken(req) {
  try {
    let token;

    // ✅ Try all possible cookie names
    const cookieStore = await cookies();
    token =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      req?.cookies?.get?.("next-auth.session-token")?.value ||
      req?.cookies?.get?.("__Secure-next-auth.session-token")?.value ||
      req?.cookies?.token;

    if (!token) {
      console.warn("⚠️ No session token found in cookies");
      return null;
    }

    // ✅ Verify JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.sub,
      username: payload.name,
      email: payload.email,
    };
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return null;
  }
}
