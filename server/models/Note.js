import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  audioUrls: [String],
  callerName: String,
  callerEmail: String,
  callerLocation: String,
  callerAddress: String,
  callReason: String,
}, { timestamps: true });

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
