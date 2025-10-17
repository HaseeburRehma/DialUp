// server/routes/sendTranscript.js


import express from "express";
import { sendNoteNotification } from "../utils/mailer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { transcript, callDuration, callDate, callerNumber, receiverNumber, callerEmail, receiverEmail } = req.body;

    const recipients = [callerEmail, receiverEmail].filter(Boolean);
    if (!recipients.length) return res.json({ message: "No recipients" });

    const subject = `📞 Call Summary: ${callerNumber} ↔ ${receiverNumber}`;
    const html = `
      <h2>📞 Call Summary</h2>
      <ul>
        <li>From: ${callerNumber}</li>
        <li>To: ${receiverNumber}</li>
        <li>Date: ${callDate}</li>
        <li>Duration: ${callDuration}</li>
      </ul>
      <hr>
      <h3>Transcript</h3>
      <pre>${transcript}</pre>
    `;

    for (const to of recipients) {
      await sendNoteNotification({ to, subject, html });
    }

    return res.json({ success: true, recipients });
  } catch (err) {
    console.error("sendTranscript error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
