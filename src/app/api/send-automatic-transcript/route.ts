import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    const { transcript, callDuration, callDate, callerNumber, receiverNumber } = await req.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Call Summary</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 30px; }
            .call-summary { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .summary-row:last-child { border-bottom: none; }
            .summary-label { font-weight: 600; color: #666; }
            .summary-value { color: #333; font-weight: 500; }
            .transcript { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .transcript h3 { margin-top: 0; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
            .transcript-content { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.8; background: #f8f9fa; padding: 15px; border-radius: 6px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .status-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📞 Call Summary</h1>
              <p>Automatic transcript and call details</p>
            </div>
            <div class="content">
              <div class="call-summary">
                <div class="summary-row">
                  <span class="summary-label">📱 From:</span>
                  <span class="summary-value">${callerNumber}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">📞 To:</span>
                  <span class="summary-value">${receiverNumber}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">📅 Date & Time:</span>
                  <span class="summary-value">${callDate}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">⏱️ Duration:</span>
                  <span class="summary-value">${callDuration}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">📝 Status:</span>
                  <span class="summary-value"><span class="status-badge">Completed</span></span>
                </div>
              </div>
              
              <div class="transcript">
                <h3>💬 Full Conversation Transcript</h3>
                <div class="transcript-content">${transcript}</div>
              </div>

              <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 8px; border-left: 4px solid #0277bd;">
                <p style="margin: 0; color: #01579b; font-size: 14px;">
                  <strong>📌 Note:</strong> This transcript was automatically generated and sent to both call participants. 
                  Please review for accuracy as automated transcription may contain errors.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>🤖 This is an automated message from your call management system.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email to both participants (if we have their emails)
    // In a real implementation, you'd want to extract emails from your user database
    const recipients = [
      process.env.DEFAULT_CALLER_EMAIL, // Fallback for caller
      process.env.DEFAULT_RECEIVER_EMAIL, // Fallback for receiver
    ].filter(Boolean)

    if (recipients.length === 0) {
      // If no recipients configured, just log the transcript
      console.log('Call transcript ready but no email recipients configured:', {
        callerNumber,
        receiverNumber,
        callDuration,
        transcriptPreview: transcript.substring(0, 100) + '...'
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Transcript processed but no email recipients configured' 
      })
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.filter(Boolean).join(','),
      subject: `📞 Call Summary: ${callerNumber} ↔ ${receiverNumber} - ${callDate}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true, 
      message: `Automatic transcript sent to ${recipients.length} recipient(s)`,
      recipients: recipients.length
    })

  } catch (error: any) {
    console.error('Error sending automatic transcript:', error)
    return NextResponse.json({ 
      error: 'Failed to send automatic transcript', 
      details: error.message 
    }, { status: 500 })
  }
}