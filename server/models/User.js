const mongoose = require("mongoose")
const bcrypt   = require("bcrypt")

const userSchema = new mongoose.Schema({
  name:     String,
  username: String,
  email:    String,
  password: String,  // hashed
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  plan:     { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
  planExpiry: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 }
})

// instance method
userSchema.methods.verifyPassword = function (raw) {
  return bcrypt.compare(raw, this.password)
}

module.exports = mongoose.models.User || mongoose.model("User", userSchema)