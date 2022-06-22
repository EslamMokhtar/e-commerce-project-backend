const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const userControllers = require("../controllers/user-controllers");

router.post("/login", userControllers.login);
router.post(
  "/signup",
  [
    check("email").isEmail(),
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("password").isLength({ min: 8 }),
  ],
  userControllers.signup
);
router.put(
  "/forget",
  [check("email").isEmail()],
  userControllers.forgetPassword
);
router.put(
  "/reset",
  [
    check("newPassword").isLength({ min: 8 }),
    check("resetLink").not().isEmpty(),
  ],
  userControllers.resetPassword
);
router.post(
  "/support",
  [
    check("email").isEmail(),
    check("subject").not().isEmpty(),
    check("message").not().isEmpty(),
  ],
  userControllers.support
);
router.get("/verify/:token", userControllers.verify);
router.get("/:uid", userControllers.getUser);

module.exports = router;
