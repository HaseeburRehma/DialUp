// src/server/models/Call.ts
// Updated schema to support array of recordings.

import mongoose from 'mongoose'

const callSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  number: String,
  direction: { type: String, enum: ['inbound', 'outbound'] },
  duration: Number,
  status: { type: String, enum: ['completed', 'busy', 'no-answer', 'failed'], default: 'completed' },
  timestamp: { type: Date, default: Date.now },
  recordings: [{ type: String }], // Array for multiple recordings (audio + whisper)
  notes: String,
  transcription: String,
  agentReplies: [String], // store conversation
  metadata: Object
})

export default mongoose.models.Call || mongoose.model('Call', callSchema)