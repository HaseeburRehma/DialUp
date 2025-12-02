// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  phone: { type: String, required: true, unique: true },   // 🔑 Add phone number
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
  planExpiry: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  folders: { type: [String], default: ['General', 'Personal', 'Work'] }
});

userSchema.methods.verifyPassword = function (raw) {
  return bcrypt.compare(raw, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
