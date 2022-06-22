const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const orderControllers = require("../controllers/order-controllers");

router.post("/submit", orderControllers.submitOrder);
router.get("/:uid", orderControllers.getOrders);

module.exports = router;
