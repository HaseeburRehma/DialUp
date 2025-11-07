//  server/utils/twilioVerify.ts

import twilio from "twilio";

export async function verifyTwilioNumber(phone: string) {
  if (!phone?.startsWith("+")) {
    console.warn(`⚠️ Invalid number format for Twilio Verify: ${phone}`);
    return null;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    const verification = await client.verify
      .v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phone,
        channel: "sms", // or "call"
      });

    console.log(`📞 Verification started for ${phone}`);
    return verification;
  } catch (error: any) {
    console.error(`❌ Twilio Verify Error: ${error.message}`, error.code);
    return null;
  }
}
export async function checkTwilioVerification(phone: string, code: string) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    const result = await client.verify
      .v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phone, code });

    return result.status === "approved";
  } catch (err: any) {
    console.error(`❌ Verification check failed: ${err.message}`);
    return false;
  }
}

