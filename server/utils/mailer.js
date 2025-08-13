// server/utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
});

transporter.verify((err) => {
  if (err) {
    console.error('⚠️ SMTP transporter verification failed:', err);
  } else {
    console.log('✅ SMTP transporter is ready to send messages');
  }
});

export async function sendNoteNotification({ to, subject, html }) {
  await transporter.sendMail({
    from: `"VOICE AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
