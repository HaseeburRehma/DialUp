// server/models/SIPConfig.js


import mongoose from "mongoose";

const sipConfigSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,  // 🔑 Reference User model
      ref: "User",
      required: true,
    },
    domain: { type: String, required: true },
    websocketUrl: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // ⚠️ consider encrypting in prod
    displayName: { type: String },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // auto add createdAt & updatedAt
  }
);

// Index for faster queries (e.g., fetch configs by user)
sipConfigSchema.index({ user: 1 });

export default mongoose.models.SIPConfig ||
  mongoose.model("SIPConfig", sipConfigSchema);
