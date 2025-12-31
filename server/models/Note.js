import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  audioUrls: [String],
  callerName: String,
  callerEmail: String,
  callerLocation: String,
  callerAddress: String,
  callReason: String,
  folder: { type: String, default: 'General' },
  tags: [String],
  summary: String,
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative', 'angry', 'urgent'], default: 'neutral' },
  extractedTasks: [{
    text: String,
    completed: { type: Boolean, default: false },
    dueDate: Date
  }],
  shareToken: String,
  isShared: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
