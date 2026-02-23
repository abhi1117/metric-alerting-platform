const Alert = require("../models/Alert");
const AlertEvent = require("../models/AlertEvent");
const socketService = require("./socket");

const evaluateMetric = async ({ metricName, value, timestamp }) => {
  const alerts = await Alert.find({ metricName });

  for (let alert of alerts) {
    let triggered = false;
    const t = alert.threshold;
    const now = timestamp ? new Date(timestamp) : new Date();

    if (alert.cooldownSeconds && alert.lastTriggered) {
      const last = new Date(alert.lastTriggered);
      const diffSec = (now - last) / 1000;
      if (diffSec < alert.cooldownSeconds) {
        continue;
      }
    }

    switch (alert.comparator) {
      case "GT":
        triggered = value > t;
        break;
      case "GTE":
        triggered = value >= t;
        break;
      case "LT":
        triggered = value < t;
        break;
      case "LTE":
        triggered = value <= t;
        break;
      case "EQ":
        triggered = value === t;
        break;
      default:
        triggered = false;
    }

    if (triggered) {
      const event = await AlertEvent.create({
        alertId: alert._id,
        metricName,
        metricValue: value,
        timestamp: now,
        message: alert.message,
      });

      alert.lastTriggered = now;
      await alert.save();
      
      try {
        const io = socketService.getIO();
        if (io) {
          io.emit("alert_event", event);
        }
      } catch (err) {
        console.error("Error emitting alert_event:", err);
      }
    }
  }
};

module.exports = evaluateMetric;