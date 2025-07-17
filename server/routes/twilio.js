// server/routes/twilio.js
const express = require('express');
const { jwt: { AccessToken } } = require('twilio');
const VoiceGrant = AccessToken.VoiceGrant;

const router = express.Router();

function requireLogin(req,res,next){
  if (!req.session.user) {
    return res.status(401).json({ error:'Not authenticated' });
  }
  next();
}

router.get('/', requireLogin, (req,res)=>{
  const identity = String(req.session.user.id);
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity }
  );
  token.addGrant(new VoiceGrant({
    incomingAllow: true,
    pushCredentialSid: process.env.TWILIO_PUSH_CREDENTIAL_SID
  }));
  res.json({ token: token.toJwt() });
});

module.exports = router;
