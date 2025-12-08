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
      // AnswerAI fields
      isAnswerAI,
      sessionName,
      candidateName,
      candidateEmail,
      interviewerName,
      position,
      company,
      questionsCount,
      answersCount,
    } = await req.json();

    // Validate transcript
    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Detect email recipients
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g;
    const recipients = new Set<string>();

    // Priority for AnswerAI: candidateEmail
    if (isAnswerAI && candidateEmail) {
      recipients.add(candidateEmail.trim());
    } else {
      // Regular call: use caller and receiver emails
      if (callerEmail) recipients.add(callerEmail.trim());
      if (receiverEmail) recipients.add(receiverEmail.trim());
    }

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
    const subject = isAnswerAI
      ? `🤖 Interview Session Summary: ${position} @ ${company}`
      : `📞 Call Summary: ${callerNumber || "Unknown"} ↔ ${receiverNumber || "Unknown"}`;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const html = isAnswerAI
      ? `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669; border-bottom: 3px solid #059669; padding-bottom: 10px;">🤖 Interview Session Summary</h2>
        
        <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #047857;">Session Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 5px 0;"><strong>Session:</strong> ${sessionName || 'N/A'}</li>
            <li style="padding: 5px 0;"><strong>Candidate:</strong> ${candidateName || 'N/A'}</li>
            <li style="padding: 5px 0;"><strong>Position:</strong> ${position || 'N/A'}</li>
            <li style="padding: 5px 0;"><strong>Company:</strong> ${company || 'N/A'}</li>
            ${interviewerName ? `<li style="padding: 5px 0;"><strong>Interviewer:</strong> ${interviewerName}</li>` : ''}
            <li style="padding: 5px 0;"><strong>Date:</strong> ${callDate || new Date().toLocaleString()}</li>
            <li style="padding: 5px 0;"><strong>Duration:</strong> ${callDuration || 'N/A'}</li>
          </ul>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #1e40af;">Interview Statistics</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="text-align: center; padding: 10px; background: white; border-radius: 4px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${questionsCount || 0}</div>
              <div style="font-size: 12px; color: #64748b;">Questions</div>
            </div>
            <div style="text-align: center; padding: 10px; background: white; border-radius: 4px;">
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${answersCount || 0}</div>
              <div style="font-size: 12px; color: #64748b;">AI Answers</div>
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <h3 style="color: #334155;">📝 Full Interview Transcript</h3>
        <pre style="background: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; font-family: 'Courier New', monospace; font-size: 13px; color: #1e293b; border: 1px solid #e2e8f0; max-height: 500px; overflow-y: auto;">
${transcript.trim()}
        </pre>

        <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>Note:</strong> This transcript was automatically generated using AI. Please review for accuracy.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>Powered by VhisperAI Interview Assistant</p>
        </div>
      </div>
    `
      : `
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
