import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  transcriptionMode: { type: String, enum: ['live','batch'], default: 'batch' },
  audioSources: {
    microphone: { type: Boolean, default: true },
    systemAudio: { type: Boolean, default: false },
  },
  transcriptionModel: { type: String, enum: ['tiny','base','small','medium','large'], default: 'base' },
  language: { type: String, default: 'en' },
  autoPunctuation: { type: Boolean, default: true },
  whisperlive: {
    enabled: { type: Boolean, default: false },
    serverUrl: String,
    port: Number,
    backend: String,
    vad: Boolean,
    translate: Boolean,
    saveRecording: Boolean,
    outputFilename: String,
    maxClients: Number,
    maxConnectionTime: Number,
  }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
