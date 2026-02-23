const Alert = require("../models/Alert");
const AlertEvent = require("../models/AlertEvent");
const socketService = require("./socket");
const logger = require("../utils/logger");

/**
 * Evaluate metric against all matching alert rules
 * Triggers alerts if thresholds are breached and cooldown allows
 * @param {object} params - Evaluation parameters
 * @param {string} params.metricName - Name of the metric
 * @param {number} params.value - Metric value
 * @param {Date|string} params.timestamp - Metric timestamp (optional)
 * @throws {Error} If database operations fail
 */
const evaluateMetric = async ({ metricName, value, timestamp }) => {
  try {
    logger.debug("Starting metric evaluation", { metricName, value });

    const alerts = await Alert.find({ metricName });
    logger.info(`Found ${alerts.length} alert(s) for metric`, { metricName });

    if (alerts.length === 0) {
      logger.debug("No alerts configured for metric", { metricName });
      return;
    }

    for (let alert of alerts) {
      try {
        const now = timestamp ? new Date(timestamp) : new Date();
        let triggered = false;

        // Check cooldown
        if (alert.cooldownSeconds && alert.lastTriggered) {
          const last = new Date(alert.lastTriggered);
          const diffSec = (now - last) / 1000;
          
          if (diffSec < alert.cooldownSeconds) {
            logger.debug("Alert in cooldown period", {
              alertId: alert._id,
              metricName,
              cooldownRemaining: Math.ceil(alert.cooldownSeconds - diffSec),
            });
            continue;
          }
        }

        // Evaluate comparator
        const t = alert.threshold;
        triggered = evaluateComparator(alert.comparator, value, t);

        if (triggered) {
          logger.info("Alert threshold breached", {
            alertId: alert._id,
            metricName,
            threshold: t,
            comparator: alert.comparator,
            metricValue: value,
          });

          // Create alert event
          const event = await AlertEvent.create({
            alertId: alert._id,
            metricName,
            metricValue: value,
            timestamp: now,
            message: alert.message,
          });

          // Update alert lastTriggered
          alert.lastTriggered = now;
          await alert.save();

          logger.info("Alert event created and persisted", {
            eventId: event._id,
            alertId: alert._id,
            metricName,
          });

          // Emit to connected clients
          try {
            const io = socketService.getIO();
            if (io) {
              io.emit("alert_event", event);
              logger.debug("Alert event emitted via Socket.IO", { eventId: event._id });
            } else {
              logger.warn("Socket.IO not initialized; event not broadcast", { metricName });
            }
          } catch (err) {
            logger.error("Failed to emit alert_event via Socket.IO", err);
          }
        }
      } catch (err) {
        logger.error(`Error processing alert ${alert._id}`, err);
        // Continue evaluating other alerts
      }
    }

    logger.debug("Metric evaluation complete", { metricName });
  } catch (err) {
    logger.error("Critical error in metric evaluation", err);
    throw err;
  }
};

/**
 * Evaluate comparator logic
 * @param {string} comparator - Comparator operator (GT, GTE, LT, LTE, EQ)
 * @param {number} value - Current metric value
 * @param {number} threshold - Threshold value
 * @returns {boolean} True if condition is met
 */
function evaluateComparator(comparator, value, threshold) {
  switch (comparator) {
    case "GT":
      return value > threshold;
    case "GTE":
      return value >= threshold;
    case "LT":
      return value < threshold;
    case "LTE":
      return value <= threshold;
    case "EQ":
      return value === threshold;
    default:
      logger.warn("Unknown comparator", { comparator });
      return false;
  }
}

module.exports = evaluateMetric;
