// server/utils/mailer.js
import nodemailer from "nodemailer"

/**
 * @typedef {Object} MailOptions
 * @property {string} to
 * @property {string} subject
 * @property {string} html
 * @property {string} [from] - Optional sender (defaults to SMTP_USER)
 */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
})

transporter.verify((err) => {
  if (err) {
    console.error("⚠️ SMTP transporter verification failed:", err)
  } else {
    console.log("✅ SMTP transporter is ready to send messages")
  }
})

/**
 * Sends an email using the configured transporter.
 * @param {MailOptions} options
 */
export async function sendNoteNotification({ to, subject, html, from }) {
  await transporter.sendMail({
    from: from || `"VOICE AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}
