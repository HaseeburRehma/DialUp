// src/app/api/send-automatic-transcript/route.ts
import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

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
      recordingUrl,           // ✅ NEW: single recording link
      whisperRecordings = []  // ✅ NEW: array of whisper recordings
    } = await req.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript missing" }, { status: 400 })
    }

    // Collect recipients
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g
    let recipients: string[] = []
    if (callerEmail) recipients.push(callerEmail)
    if (receiverEmail) recipients.push(receiverEmail)

    // fallback: extract from transcript if no explicit receiver
    if (!receiverEmail) {
      const found = transcript.match(emailRegex)
      if (found?.length) recipients.push(found[0])
    }

    recipients = [...new Set(recipients.filter(Boolean))] // dedupe

    // Setup SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Recording Section (only if exists)
    const recordingSection = (recordingUrl || whisperRecordings.length) ? `
      <div style="margin-top:20px; padding: 15px; background:#fef9c3; border-left:4px solid #eab308; border-radius:8px;">
        <h3 style="margin-top:0; font-size:16px;">🎧 Call Recording</h3>
        ${recordingUrl ? `<p><a href="${recordingUrl}" style="color:#2563eb; font-weight:600;" target="_blank">▶️ Listen to Full Recording</a></p>` : ""}
        ${whisperRecordings.length ? `
          <ul style="padding-left:20px; margin:10px 0;">
            ${whisperRecordings.map((url: string, i: number) => 
              `<li><a href="${url}" style="color:#2563eb;" target="_blank">Whisper Clip ${i+1}</a></li>`).join("")}
          </ul>
        ` : ""}
      </div>
    ` : ""

    // Build HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Call Summary & Transcript</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 400; }
            .content { padding: 25px; }
            .summary { background: #f9fafb; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .row span:first-child { font-weight: 600; color: #555; }
            .row span:last-child { color: #222; }
            .transcript { border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 15px; }
            .transcript h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            .transcript-content { font-family: monospace; font-size: 14px; white-space: pre-wrap; }
            .footer { background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📞 Call Summary</h1>
            </div>
            <div class="content">
              <div class="summary">
                <div class="row"><span>📱 From:</span><span>${callerNumber || "Unknown"}</span></div>
                <div class="row"><span>📞 To:</span><span>${receiverNumber || "Unknown"}</span></div>
                <div class="row"><span>📅 Date:</span><span>${callDate || "N/A"}</span></div>
                <div class="row"><span>⏱ Duration:</span><span>${callDuration || "N/A"}</span></div>
                <div class="row"><span>Status:</span><span style="color:green;font-weight:600;">Completed</span></div>
              </div>
              <div class="transcript">
                <h3>📝 Conversation Transcript</h3>
                <div class="transcript-content">${transcript}</div>
              </div>
              ${recordingSection}
            </div>
            <div class="footer">
              <p>Generated automatically on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `

    if (!recipients.length) {
      console.warn("Transcript ready but no recipients:", {
        callerNumber, receiverNumber, callDuration, callDate
      })
      return NextResponse.json({ success: true, message: "Transcript generated but no recipients found" })
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.join(","),
      subject: `📞 Call Summary: ${callerNumber || "Unknown"} ↔ ${receiverNumber || "Unknown"} - ${callDate}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, recipients, message: "Transcript email sent" })

  } catch (err: any) {
    console.error("Error sending transcript:", err)
    return NextResponse.json({ error: "Email send failed", details: err.message }, { status: 500 })
  }
}
