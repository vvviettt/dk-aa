const express = require("express");
const authRouter = require("./user/auth.routes");
const registryRouter = require("./user/registry.routes");
const carRouter = require("./user/car.routes");
const notificationRouter = require("./user/notification.routes");
const employeeAuthRouter = require("./employee/auth.routes");
const employeeRegistryRouter = require("./employee/registry.routes");
const employeeNotificationRouter = require("./employee/notification.routes");
const authMiddleware = require("../middleware/authorization.middleware");

const router = express.Router();

const userRoutes = [{ path: "/auth", route: authRouter }];
const userPrivateRoutes = [
    { path: "/registries", route: registryRouter },
    { path: "/cars", route: carRouter },
    { path: "/notifications", route: notificationRouter },
];
const employeeRotes = [
    {
        path: "/auth",
        route: employeeAuthRouter,
    },
    { path: "/notification", route: employeeNotificationRouter },
];
const employeePrivateRotes = [{ path: "/registry", route: employeeRegistryRouter }];

userRoutes.forEach((route) => {
    router.use("/customer" + route.path, route.route);
});

userPrivateRoutes.forEach((route) => {
    router.use("/customer" + route.path, authMiddleware.checkUser, route.route);
});

employeeRotes.forEach((route) => {
    router.use("/employee" + route.path, route.route);
});
employeePrivateRotes.forEach((route) => {
    router.use("/employee" + route.path, authMiddleware.checkEmployee, route.route);
});

module.exports = router;
