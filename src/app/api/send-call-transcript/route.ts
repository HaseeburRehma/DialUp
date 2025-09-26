import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, callerNumber, transcript, callDuration, callDate } = await req.json()

    if (!recipientEmail || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Configure nodemailer (you'll need to add these environment variables)
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
          <title>Call Transcript</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 30px; }
            .call-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-label { font-weight: 600; color: #666; }
            .info-value { color: #333; }
            .transcript { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .transcript h3 { margin-top: 0; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
            .transcript-content { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.8; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📞 Call Transcript</h1>
              <p>Your call details and conversation transcript</p>
            </div>
            <div class="content">
              <div class="call-info">
                <div class="info-row">
                  <span class="info-label">📱 Caller Number:</span>
                  <span class="info-value">${callerNumber || 'Unknown'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📅 Call Date:</span>
                  <span class="info-value">${callDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⏱️ Duration:</span>
                  <span class="info-value">${callDuration}</span>
                </div>
              </div>
              
              <div class="transcript">
                <h3>📝 Conversation Transcript</h3>
                <div class="transcript-content">${transcript}</div>
              </div>
            </div>
            <div class="footer">
              <p>This transcript was automatically generated from your phone call.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject: `📞 Call Transcript - ${callDate}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Transcript sent successfully' 
    })

  } catch (error: any) {
    console.error('Error sending transcript email:', error)
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error.message 
    }, { status: 500 })
  }
}