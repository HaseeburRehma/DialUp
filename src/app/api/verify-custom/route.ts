//  src/app/api/verify-custom/route.ts
import { NextResponse } from "next/server";

// This would normally check DB or Redis for the OTP you saved
let tempStore: Record<string, string> = {}; // replace with DB later

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  if (!phone || !code)
    return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });

  const stored = tempStore[phone];
  if (stored && stored === code) {
    delete tempStore[phone];
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false });
}
