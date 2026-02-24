const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/alertController");
const { protect } = require("../middleware/auth");

// All alert routes require authentication
router.post("/", protect, ctrl.createAlert);
router.get("/", protect, ctrl.getAlerts);
router.delete("/:id", protect, ctrl.deleteAlert);

module.exports = router;