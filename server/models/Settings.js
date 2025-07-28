// server/models/Settings.js
import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  // either use this:
  userEmail: { type: String, required: true, unique: true },

  // …or if you want to use ObjectId:
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

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
}, { timestamps: true })

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)
