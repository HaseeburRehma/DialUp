//  server/utils/customOTP.ts
import twilio from "twilio";



const client = twilio(
    process.env.TWILIO_API_KEY_SID!,
    process.env.TWILIO_API_KEY_SECRET!,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
);
export async function sendCustomOTP(phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000);

    await client.messages.create({
        body: `Your VoiceAI verification code is ${code}`,
        messagingServiceSid: "MG3003536dee03ea24d8ae88afa276eb82", // your Messaging Service SID
        to: phone,
    });

    // return the code so you can temporarily store and verify later
    return code;
}
