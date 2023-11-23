const express = require("express");
const registryController = require("../../controllers/user/registry.controller");
const {
    checkCarWithId,
    checkRegistry,
    checkCarWithLicensePlate,
} = require("../../middleware/authorization.middleware");
const validator = require("../../middleware/validate.middleware");
const { licensePlateSchema } = require("../../validations/car.validate");
const {
    costCalculationSchema,
    registrationSchema,
    dateSchema,
} = require("../../validations/registry.validation");
const router = express.Router();

router.post(
    "",
    validator(registrationSchema, "body"),
    checkCarWithId,
    registryController.addNewRegistry
);
// router.post("", validator("body"), registryController.addNewRegistry);
router.get("/info", checkRegistry, registryController.getRegistryInfo);
router.get("/bill", checkRegistry, registryController.getRegistryBill);
router.get("/profile", registryController.getRegistryProfile);
router.get("/hot-line", registryController.getRegistryHotLine);
router.get(
    "/limit-vehicles",
    validator(dateSchema, "query"),
    registryController.checkNumberVehicles
);
router.put(
    "/info",
    validator(registrationSchema, "body"),
    checkRegistry,
    registryController.updateRegistry
);
router.delete("/info", checkRegistry, registryController.deleteRegistry);
router.get("/list-registries", registryController.getRegistries);
router.get(
    "/list-registries-history",
    validator(licensePlateSchema, "query"),
    checkCarWithLicensePlate,
    registryController.getRegistryHistory
);
router.get("/list-registries-future", registryController.getRegistriesInFuture);
router.get(
    "/list-registries-date",
    validator(dateSchema, "query"),
    registryController.getRegistriesWithDate
);
router.post(
    "/cost-calculation",
    validator(costCalculationSchema, "body"),
    registryController.costCalculation
);

module.exports = router;
