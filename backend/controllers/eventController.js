const AlertEvent = require("../models/AlertEvent");
const logger = require("../utils/logger");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Retrieve alert events with optional filtering and pagination
 * @param {object} req - Express request with query params
 * @param {object} res - Express response
 */
exports.getEvents = async (req, res) => {
  try {
    const { metricName, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, start, end } = req.query;

    logger.debug("Fetching alert events", { metricName, page, limit, start, end });

    const q = {};
    if (metricName) {
      if (typeof metricName !== "string") {
        logger.warn("Invalid metricName filter type", { type: typeof metricName });
        return res.status(400).json({ error: "metricName filter must be a string" });
      }
      q.metricName = metricName;
    }

    // Handle date range filtering
    if (start || end) {
      q.timestamp = {};
      if (start) {
        const startDate = new Date(start);
        if (isNaN(startDate.getTime())) {
          logger.warn("Invalid start date", { start });
          return res.status(400).json({ error: "start must be a valid ISO date string" });
        }
        q.timestamp.$gte = startDate;
      }
      if (end) {
        const endDate = new Date(end);
        if (isNaN(endDate.getTime())) {
          logger.warn("Invalid end date", { end });
          return res.status(400).json({ error: "end must be a valid ISO date string" });
        }
        q.timestamp.$lte = endDate;
      }
    }

    // Validate and parse pagination
    const numericPage = Math.max(1, Number(page) || DEFAULT_PAGE);
    const numericLimit = Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT));

    logger.debug("Query parameters validated", { 
      pageNum: numericPage, 
      limitNum: numericLimit 
    });

    const total = await AlertEvent.countDocuments(q);
    const events = await AlertEvent.find(q)
      .sort({ timestamp: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);

    const totalPages = Math.ceil(total / numericLimit);

    logger.info("Alert events retrieved", { 
      count: events.length, 
      total, 
      page: numericPage, 
      totalPages,
      metricName: metricName || 'all'
    });

    res.json({
      meta: {
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: totalPages,
      },
      data: events,
    });
  } catch (err) {
    logger.error("Error retrieving alert events", err);
    res.status(500).json({ 
      error: err.message || "Failed to retrieve alert events",
      type: err.name
    });
  }
};
