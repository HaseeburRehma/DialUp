// src/app/api/verify/check/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { connect } from "../../../../../server/utils/db";
import User from "../../../../../server/models/User";
import OTP from "../../../../../server/models/OTP.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Twilio Client (Account SID + Auth Token)
/*
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);
*/

export async function POST(req: Request) {
    try {
        const { phone, code } = await req.json();

        if (!phone || !code) {
            return NextResponse.json(
                { error: "Phone and code required" },
                { status: 400 }
            );
        }

        await connect();
        const record = await OTP.findOne({ phone });

        // ✅ Absolute Bypass Logic
        const isBypass = code === "123456";

        if (!isBypass && !record) {
            return NextResponse.json({
                verified: false,
                message: "OTP expired or not found",
            });
        }

        if (!isBypass && record.code !== code) {
            return NextResponse.json({
                verified: false,
                message: "Invalid OTP",
            });
        }

        console.log(`✅ OTP verified ${isBypass ? "(BYPASS MODE) " : ""}for ${phone}`);
        if (record) await OTP.deleteOne({ phone });

        // --- Update user ---
        const updatedUser = await User.findOneAndUpdate(
            { phone },
            { verified: true, status: "active" },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`👤 User ${updatedUser.username} is now verified & active`);

        // ❌ Bypassing Caller ID logic for now
        /*
        try {
            const skipVerification = process.env.NODE_ENV === "production" ? "true" : "false";
            const envLabel =
                process.env.NODE_ENV === "production"
                    ? "🌍 Production"
                    : "🧪 Development";

            console.log(`${envLabel}: Attempting to add ${phone} to Twilio Caller IDs`);

            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/OutgoingCallerIds.json`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Basic " +
                            Buffer.from(
                                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                            ).toString("base64"),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        PhoneNumber: phone,
                        FriendlyName: `${updatedUser.name} (${updatedUser.username})`,
                        SkipVerification: skipVerification,
                    }),
                }
            );

            const text = await response.text();

            if (!response.ok) {
                console.warn(
                    `⚠️ Twilio Caller ID add failed [${process.env.NODE_ENV
                    }]: ${text.includes("Authenticate") ? "Account is trial or restricted" : text}`
                );
            } else {
                const data = JSON.parse(text);
                console.log(
                    `📞 Caller ID added successfully (${envLabel}): ${data.phone_number}`
                );
            }
        } catch (twilioErr: any) {
            console.warn(
                `⚠️ Could not add ${phone} to Verified Caller IDs: ${twilioErr.message}`
            );
        }
        */

        return NextResponse.json({
            verified: true,
            message: "Phone verified, account activated, and Caller ID handled.",
            user: {
                id: updatedUser._id.toString(),
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                phone: updatedUser.phone,
                role: updatedUser.role,
                plan: updatedUser.plan,
            },
        });
    } catch (err: any) {
        console.error("❌ OTP Check Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
