const evaluateMetric = require("../services/evaluator");

exports.ingestMetric = async (req, res) => {
  try {
    const { metricName, value, timestamp } = req.body;
    if (!metricName || value === undefined) {
      return res.status(400).json({ error: "metricName and value are required" });
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return res.status(400).json({ error: "value must be a number" });
    }

    await evaluateMetric({ metricName, value: numericValue, timestamp });
    res.json({ message: "Metric processed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};