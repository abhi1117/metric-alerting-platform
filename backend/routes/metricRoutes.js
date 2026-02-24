const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/metricController");
const { protect } = require("../middleware/auth");

// All metric routes require authentication
router.post("/", protect, ctrl.ingestMetric);

module.exports = router;