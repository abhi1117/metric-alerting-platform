const mongoose = require("mongoose");

const alertEventSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  metricName: { type: String, required: true, index: true },
  metricValue: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true },
  message: { type: String, required: true },
}, { timestamps: true });

alertEventSchema.index({ timestamp: -1, metricName: 1 });
alertEventSchema.index({ metricName: 1, timestamp: -1 });

module.exports = mongoose.model("AlertEvent", alertEventSchema);