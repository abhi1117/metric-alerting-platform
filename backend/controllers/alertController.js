const Alert = require("../models/Alert");
const logger = require("../utils/logger");

const ALLOWED_COMPARATORS = ["GT", "LT", "GTE", "LTE", "EQ"];

/**
 * Create a new alert rule
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
exports.createAlert = async (req, res) => {
  try {
    const { metricName, threshold, comparator, message, cooldownSeconds } = req.body;

    // Validate required fields
    if (!metricName || threshold === undefined || !comparator || !message) {
      logger.warn("Alert creation failed: missing required fields", { body: req.body });
      return res.status(400).json({ 
        error: "metricName, threshold, comparator and message are required",
        received: { metricName, threshold, comparator, message }
      });
    }

    // Validate comparator
    if (!ALLOWED_COMPARATORS.includes(comparator)) {
      logger.warn("Alert creation failed: invalid comparator", { comparator });
      return res.status(400).json({ 
        error: `comparator must be one of: ${ALLOWED_COMPARATORS.join(", ")}`,
        received: comparator
      });
    }

    // Validate numeric threshold
    const numericThreshold = Number(threshold);
    if (Number.isNaN(numericThreshold)) {
      logger.warn("Alert creation failed: non-numeric threshold", { threshold });
      return res.status(400).json({ 
        error: "threshold must be a valid number",
        received: threshold
      });
    }

    // Validate and parse cooldown
    let numericCooldown = 0;
    if (cooldownSeconds !== undefined) {
      numericCooldown = Number(cooldownSeconds);
      if (Number.isNaN(numericCooldown) || numericCooldown < 0) {
        logger.warn("Alert creation failed: invalid cooldownSeconds", { cooldownSeconds });
        return res.status(400).json({ 
          error: "cooldownSeconds must be a non-negative number",
          received: cooldownSeconds
        });
      }
    }

    logger.info("Creating alert", { 
      metricName, 
      threshold: numericThreshold, 
      comparator, 
      cooldown: numericCooldown 
    });

    const alert = new Alert({ 
      metricName, 
      threshold: numericThreshold, 
      comparator, 
      message, 
      cooldownSeconds: numericCooldown 
    });

    const saved = await alert.save();
    
    logger.info("Alert created successfully", { 
      alertId: saved._id, 
      metricName, 
      comparator 
    });

    res.status(201).json(saved);
  } catch (err) {
    logger.error("Error creating alert", err);
    res.status(500).json({ 
      error: err.message || "Failed to create alert",
      type: err.name
    });
  }
};

/**
 * Retrieve all alert rules
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
exports.getAlerts = async (req, res) => {
  try {
    logger.debug("Fetching all alerts");
    const alerts = await Alert.find();
    
    logger.info("Alerts retrieved", { count: alerts.length });
    res.json(alerts);
  } catch (err) {
    logger.error("Error retrieving alerts", err);
    res.status(500).json({ 
      error: err.message || "Failed to retrieve alerts",
      type: err.name
    });
  }
};

/**
 * Delete an alert rule by ID
 * @param {object} req - Express request with alert ID
 * @param {object} res - Express response
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info("Deleting alert", { alertId: id });
    
    const result = await Alert.findByIdAndDelete(id);
    
    if (!result) {
      logger.warn("Alert not found for deletion", { alertId: id });
      return res.status(404).json({ 
        error: "Alert not found",
        alertId: id
      });
    }

    logger.info("Alert deleted successfully", { 
      alertId: id, 
      metricName: result.metricName 
    });

    res.json({ 
      message: "Alert deleted successfully",
      alertId: id 
    });
  } catch (err) {
    logger.error("Error deleting alert", err);
    res.status(500).json({ 
      error: err.message || "Failed to delete alert",
      type: err.name,
      alertId: req.params.id
    });
  }
};
