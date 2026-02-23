const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  metricName: { type: String, required: true, index: true },
  threshold: { type: Number, required: true },
  comparator: { type: String, required: true, enum: ["GT", "GTE", "LT", "LTE", "EQ"] },
  message: { type: String, required: true },
  cooldownSeconds: { type: Number, default: 0, min: 0 },
  lastTriggered: { type: Date, default: null },
}, { timestamps: true });

alertSchema.index({ metricName: 1 });

module.exports = mongoose.model("Alert", alertSchema);