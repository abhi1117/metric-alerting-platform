const Alert = require("../models/Alert");

exports.createAlert = async (req, res) => {
  try {
    const { metricName, threshold, comparator, message, cooldownSeconds } = req.body;

    if (!metricName || threshold === undefined || !comparator || !message) {
      return res.status(400).json({ error: "metricName, threshold, comparator and message are required" });
    }

    const allowed = ["GT", "LT", "GTE", "LTE", "EQ"];
    if (!allowed.includes(comparator)) {
      return res.status(400).json({ error: `comparator must be one of: ${allowed.join(",")}` });
    }

    const numericThreshold = Number(threshold);
    if (Number.isNaN(numericThreshold)) {
      return res.status(400).json({ error: "threshold must be a number" });
    }

    let numericCooldown = 0;
    if (cooldownSeconds !== undefined) {
      numericCooldown = Number(cooldownSeconds);
      if (Number.isNaN(numericCooldown) || numericCooldown < 0) {
        return res.status(400).json({ error: "cooldownSeconds must be a non-negative number" });
      }
    }

    const alert = new Alert({ metricName, threshold: numericThreshold, comparator, message, cooldownSeconds: numericCooldown });
    const saved = await alert.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const result = await Alert.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};