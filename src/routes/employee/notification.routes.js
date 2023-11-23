const express = require("express");
const {
    sendInfringesNotification,
    getListNotifications,
    notificationDetails,
    updateStatusNotification,
    getStatusNotification,
    sendAssignmentNotification,
    sendPaymentNotification,
    sendCompleteNotification,
} = require("../../controllers/employee/notification.controller");
const { checkEmployee } = require("../../middleware/authorization.middleware");
const validator = require("../../middleware/validate.middleware");
const { notificationFromExcel } = require("../../validations/notification.validation");
const { idSchema } = require("../../validations/registry.validation");
const router = express.Router();

router.post("/infringes", validator(notificationFromExcel, "body"), sendInfringesNotification);
router.post("/assignment",  sendAssignmentNotification);
router.post("/payment",  sendPaymentNotification);
router.post("/complete",  sendCompleteNotification);
router.get("/list", checkEmployee, getListNotifications);
router.get("/check", checkEmployee, getStatusNotification);
router.put("/check", checkEmployee, updateStatusNotification);
router.get("/", validator(idSchema, "query"), checkEmployee, notificationDetails);
module.exports = router;
