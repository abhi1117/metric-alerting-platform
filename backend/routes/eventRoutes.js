const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/eventController");
const { protect } = require("../middleware/auth");

// All event routes require authentication
router.get("/", protect, ctrl.getEvents);

module.exports = router;