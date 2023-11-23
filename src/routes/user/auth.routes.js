const express = require("express");

const authMiddleware = require("../../middleware/authorization.middleware");
const validator = require("../../middleware/validate.middleware");
const {
    registerSchema,
    loginSchema,
    logoutSchema,
    updateUser,
    verifySchema,
} = require("../../validations/auth.validation");
const authController = require("../../controllers/user/auth.controller");
const router = express.Router();

router.post("/register", validator(registerSchema, "body"), authController.register);
router.post("/verifyOTP", validator(verifySchema, "body"), authController.verifyOtp);
router.patch("/user", authMiddleware.checkUser, authController.updateUser);
router.get("/user", authMiddleware.checkUser, authController.getUserInfo);
router.post("/login", validator(loginSchema, "body"), authController.login);
router.post(
    "/logout",
    authMiddleware.checkUser,
    validator(logoutSchema, "body"),
    authController.logout
);

module.exports = router;
