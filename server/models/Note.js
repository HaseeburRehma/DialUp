const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text:         { type: String, required: true },
  userId:       { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  audioUrls:    [String],
  callerName:   String,
  callerEmail:  String,
  callerLocation: String,
  callerAddress:  String,
  callReason:     String,
}, {
  timestamps: true
});

// If the model is already compiled, use that one, otherwise create it
module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);
