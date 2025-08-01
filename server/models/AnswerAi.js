const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  speaker: { type: String, enum: ['interviewer', 'candidate'], required: true },
  timestamp: { type: Number, required: true },
  audioSegment: { type: String }
});

const answerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  questionId: { type: String, required: true },
  content: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.8 },
  generatedAt: { type: Number, required: true },
  isAiGenerated: { type: Boolean, default: true }
});

const answerAISchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionName: { type: String, required: true },
  interviewerName: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String },
  position: { type: String, required: true },
  company: { type: String, required: true },
  questions: [questionSchema],
  answers: [answerSchema],
  audioUrls: [{ type: String }],
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed'], 
    default: 'active' 
  },
  totalDuration: { type: Number, default: 0 }, // in seconds
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

answerAISchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.AnswerAI || mongoose.model('AnswerAI', answerAISchema);
