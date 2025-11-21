// src/server/models/AiAgentCall.ts
import mongoose from 'mongoose';

const aiAgentCallSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    callId: { type: String, index: true }, // Retell call_id
    callType: { type: String, enum: ['phone_call', 'web_call'] },
    agentId: String,
    agentName: String,
    callStatus: String,
    direction: { type: String, enum: ['inbound', 'outbound'] },
    fromNumber: String,
    toNumber: String,

    startTimestamp: Date,
    endTimestamp: Date,
    durationMs: Number,

    disconnectionReason: String,

    recordings: [{ type: String }], // you can push recording_url, scrubbed_recording_url, etc.
    transcript: String,
    agentReplies: [String], // if you ever parse transcript into turns
    metadata: Object,
    raw: Object, // store full Retell call object if you want
  },
  { timestamps: true },
);

export default mongoose.models.AiAgentCall ||
  mongoose.model('AiAgentCall', aiAgentCallSchema);
