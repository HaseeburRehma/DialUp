import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "server/config/authOptions.js";
import { connect } from '../../../../../server/utils/db.js';

import SIPConfig from "../../../../../server/models/SIPConfig.js";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        const userConfig = await SIPConfig.findOne({ user: session.user.id }).select("-password");


        if (!userConfig) {
            return NextResponse.json(
                {
                    domain: "",
                    websocketUrl: "",
                    username: "",
                    displayName: session.user.name || "",
                },
                { status: 200 }
            );
        }

        return NextResponse.json(userConfig, { status: 200 });
    } catch (error: any) {
        console.error("Get SIP config error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { domain, websocketUrl, username, password, displayName } =
            await req.json();

        if (!domain || !websocketUrl || !username || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        await connect();

        // Upsert SIPConfig for this user
        await SIPConfig.findOneAndUpdate(
            { user: session.user.id },
            { domain, websocketUrl, username, password, displayName },
            { upsert: true, new: true, runValidators: true }
        );

        return NextResponse.json(
            { message: "SIP configuration saved successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Save SIP config error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
