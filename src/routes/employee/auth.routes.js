const express = require("express");

const validator = require("../../middleware/validate.middleware");
const {
    token,
    changePasswordSchema,
    employeeLoginSchema,
} = require("../../validations/auth.validation");
const authController = require("../../controllers/employee/auth.controller");
const authControllerEmployee = require("../../controllers/user/auth.controller");
const { checkEmployee } = require("../../middleware/authorization.middleware");
const router = express.Router();

router.post("/login", validator(employeeLoginSchema, "body"), authController.login);
router.post("/refresh-token", validator(token, "body"), authController.refreshToken);
router.patch("/user", checkEmployee, authController.updateEmployee);
router.get("/user", checkEmployee, authController.getUserInfo);
router.patch(
    "/password",
    validator(changePasswordSchema, "body"),
    checkEmployee,
    authController.changePassword
);

// router.post(
//     "/logout",
//     authMiddleware.checkUser,
//     validator(logoutSchema, "body"),
//     authController.logout
// );

module.exports = router;
