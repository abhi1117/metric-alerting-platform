const AlertEvent = require("../models/AlertEvent");

exports.getEvents = async (req, res) => {
  try {
    const { metricName, page = 1, limit = 20, start, end } = req.query;

    const q = {};
    if (metricName) q.metricName = metricName;
    if (start || end) q.timestamp = {};
    if (start) q.timestamp.$gte = new Date(start);
    if (end) q.timestamp.$lte = new Date(end);

    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Math.min(100, Number(limit) || 20));

    const total = await AlertEvent.countDocuments(q);
    const events = await AlertEvent.find(q)
      .sort({ timestamp: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);

    res.json({
      meta: {
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.ceil(total / numericLimit),
      },
      data: events,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};