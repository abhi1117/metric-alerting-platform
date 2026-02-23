const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/metricController");

router.post("/", ctrl.ingestMetric);

module.exports = router;