const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/alertController");

router.post("/", ctrl.createAlert);
router.get("/", ctrl.getAlerts);
router.delete("/:id", ctrl.deleteAlert);

module.exports = router;