// src/app/api/calls/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connect } from "../../../../../server/utils/db"
import Call from "../../../../../server/models/Call"
import { authOptions } from "server/config/authOptions.js"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connect()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const updated = await Call.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: body },
      { new: true }
    )

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("❌ Update Call Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connect()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const deleted = await Call.findOneAndDelete({ _id: id, userId: session.user.id })
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("❌ Delete Call Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
