// server/models/Settings.js
import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  transcriptionMode: { type: String, enum: ['live', 'batch'], default: 'batch' },
  audioSources: {
    microphone: { type: Boolean, default: true },
    systemAudio: { type: Boolean, default: false }
  },
  transcriptionModel: { type: String, enum: ['tiny', 'base', 'small', 'medium', 'large'], default: 'base' },
  language: { type: String, default: 'en' },
  autoPunctuation: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)
