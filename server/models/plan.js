const mongoose = require("mongoose")

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  price: { type: Number, required: true }, // in cents
  currency: { type: String, default: 'usd' },
  interval: { type: String, enum: ['month', 'year'], default: 'month' },
  features: [String],
  limits: {
    monthlyMinutes: { type: Number, default: 0 }, // 0 = unlimited
    storageGB: { type: Number, default: 1 },
    maxUsers: { type: Number, default: 1 }
  },
  stripeProductId: String,
  stripePriceId: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})