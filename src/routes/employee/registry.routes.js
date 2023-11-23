const express = require("express");
const registryController = require("../../controllers/employee/registry.controller");
const employeeRegistryController = require("../../controllers/employee/registry.controller");
const {
    checkRoleView,
    checkRoleEditPay,
    checkRoleEditComplete,
} = require("../../middleware/authorization.middleware");
const validator = require("../../middleware/validate.middleware");
const {
    dateSchema,
    idSchema,
    typeSchema,
    competeSchema,
    payForRegisterSchema,
} = require("../../validations/registry.validation");
const route = express.Router();

route.get("/", validator(dateSchema, "query"), employeeRegistryController.getRegistryToday);
route.put(
    "/pay",
    validator(payForRegisterSchema, "body"),
    checkRoleEditPay,
    employeeRegistryController.payForRegistry
);
route.put(
    "/complete",
    validator(competeSchema, "body"),
    checkRoleEditComplete,
    employeeRegistryController.completeForRegistry
);
route.get("/info", validator(idSchema, "query"), employeeRegistryController.getRegistryInfo);
route.get(
    "/list",
    validator(typeSchema, "query"),
    checkRoleView,
    employeeRegistryController.getRegistries
);
route.get("/list-registries-date", registryController.listRegistryDate);

module.exports = route;
