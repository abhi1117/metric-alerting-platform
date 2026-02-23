const evaluateMetric = require("../services/evaluator");
const logger = require("../utils/logger");

/**
 * Ingest a metric and trigger alert evaluation
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
exports.ingestMetric = async (req, res) => {
  try {
    const { metricName, value, timestamp } = req.body;

    // Validate required fields
    if (!metricName || value === undefined) {
      logger.warn("Metric ingestion failed: missing required fields", { body: req.body });
      return res.status(400).json({ 
        error: "metricName and value are required",
        received: { metricName, value }
      });
    }

    // Validate metric name format
    if (typeof metricName !== "string" || metricName.trim() === "") {
      logger.warn("Metric ingestion failed: invalid metricName", { metricName });
      return res.status(400).json({ 
        error: "metricName must be a non-empty string",
      });
    }

    // Validate numeric value
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      logger.warn("Metric ingestion failed: non-numeric value", { value });
      return res.status(400).json({ 
        error: "value must be a valid number",
        received: value
      });
    }

    // Validate timestamp if provided
    if (timestamp) {
      const parsedTime = new Date(timestamp);
      if (isNaN(parsedTime.getTime())) {
        logger.warn("Metric ingestion failed: invalid timestamp", { timestamp });
        return res.status(400).json({ 
          error: "timestamp must be a valid ISO date string",
          received: timestamp
        });
      }
    }

    logger.info("Metric ingestion started", { 
      metricName, 
      value: numericValue,
      timestamp: timestamp || 'current'
    });

    // Evaluate metric against alerts
    await evaluateMetric({ metricName, value: numericValue, timestamp });

    logger.info("Metric processing complete", { metricName, value: numericValue });
    res.json({ 
      message: "Metric processed successfully",
      metric: { metricName, value: numericValue, timestamp: timestamp || new Date().toISOString() }
    });
  } catch (err) {
    logger.error("Error processing metric", err);
    res.status(500).json({ 
      error: err.message || "Failed to process metric",
      type: err.name
    });
  }
};
