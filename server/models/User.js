// server/models/User.js
const mongoose = require("mongoose")
const bcrypt   = require("bcrypt")

const userSchema = new mongoose.Schema({
  name:     String,
  username: String,
  email:    String,
  password: String,  // hashed
})

// instance method
userSchema.methods.verifyPassword = function (raw) {
  return bcrypt.compare(raw, this.password)
}

module.exports = mongoose.models.User || mongoose.model("User", userSchema)
