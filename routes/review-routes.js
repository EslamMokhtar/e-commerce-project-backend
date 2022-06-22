const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const reviewControllers = require("../controllers/review-controllers");

router.post("/add", reviewControllers.addReview);
router.get("/:pid", reviewControllers.getReview);

module.exports = router;
