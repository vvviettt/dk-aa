const express = require("express");
const notificationController = require("../../controllers/user/notification.controller");
const routes = express.Router();

routes.get("/", notificationController.getNotifications);
routes.post("/send/infringes", notificationController.getNotifications);
routes.get("/info", notificationController.getNotificationInfo);
routes.get("/check", notificationController.getStatusNotification);
routes.put("/check", notificationController.updateStatusNotification);
routes.get("/test", notificationController.test);

module.exports = routes;
