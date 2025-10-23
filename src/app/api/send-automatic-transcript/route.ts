// src/app/api/send-automatic-transcript/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendNoteNotification } from "../../../../server/utils/mailer.js";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      transcript,
      callDuration,
      callDate,
      callerNumber,
      receiverNumber,
      callerEmail,
      receiverEmail,
    } = await req.json();

    // Validate transcript
    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Detect email addresses inside transcript as fallback
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g;
    const recipients = new Set<string>();

    if (callerEmail) recipients.add(callerEmail.trim());
    if (receiverEmail) recipients.add(receiverEmail.trim());

    // Fallback: scrape from transcript if missing
    if (recipients.size === 0) {
      const found = transcript.match(emailRegex);
      if (found?.length) {
        for (const email of found.slice(0, 2)) recipients.add(email);
      }
    }

    // ❗ Return 400 if no valid recipients
    if (recipients.size === 0) {
      console.warn("❌ send-automatic-transcript: no valid recipients", {
        callerNumber,
        receiverNumber,
        callDuration,
        callDate,
      });
      return NextResponse.json(
        { error: "No valid email recipients found for this transcript." },
        { status: 400 }
      );
    }

    // Email structure
    const subject = `📞 Call Summary: ${callerNumber || "Unknown"} ↔ ${receiverNumber || "Unknown"}`;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const html = `
      <h2>📞 Call Summary</h2>
      <ul>
        <li><strong>From:</strong> ${callerNumber || "Unknown"}</li>
        <li><strong>To:</strong> ${receiverNumber || "Unknown"}</li>
        <li><strong>Date:</strong> ${callDate || new Date().toLocaleString()}</li>
        <li><strong>Duration:</strong> ${callDuration || "N/A"}</li>
      </ul>
      <hr />
      <h3>📝 Transcript</h3>
      <pre style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;line-height:1.5;font-family:monospace;">
${transcript.trim()}
      </pre>
    `;

    const successful: string[] = [];
    const failed: string[] = [];

    // Send to each recipient individually
    for (const to of recipients) {
      try {
        await sendNoteNotification({ to, from, subject, html });
        successful.push(to);
      } catch (e: any) {
        console.error(`❌ Failed to send to ${to}:`, e.message);
        failed.push(to);
      }
    }

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.size,
      sent: successful,
      failed,
    });
  } catch (error: any) {
    console.error("❌ Fatal error in send-automatic-transcript:", error);
    return NextResponse.json(
      {
        error: "Failed to send automatic transcript",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
