// src/server/models/Call.ts
// Updated schema to support array of recordings.

import mongoose from 'mongoose'

// src/server/models/Call.ts
const callSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  number: String,
  direction: { type: String, enum: ['inbound', 'outbound'] },
  duration: Number,
  status: { type: String, enum: ['completed', 'busy', 'no-answer', 'failed'], default: 'completed' },
  timestamp: { type: Date, default: Date.now },
  recordings: [{ type: String }],
  transcription: String,
  notes: String,
  agentReplies: [String],
  metadata: Object,
  // 👇 new structured fields
  callerName: String,
  callReason: String,
  pickedBy: String,       // agent who answered
  callerEmail: String,
  callerLocation: String,
  callerAddress: String,
})



export default mongoose.models.Call || mongoose.model('Call', callSchema)