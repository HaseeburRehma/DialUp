import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
  planExpiry: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 }
});

userSchema.methods.verifyPassword = function (raw) {
  return bcrypt.compare(raw, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
