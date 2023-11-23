const express = require("express");
const carController = require("../../controllers/user/car.controller");
const { checkCarWithId } = require("../../middleware/authorization.middleware");
const validator = require("../../middleware/validate.middleware");
const {
    carSchema,
    typeSchema,
    newCarSchema,
    licensePlateSchema,
} = require("../../validations/car.validate");
const router = express.Router();

router.post("/", carController.createNewCar);
router.get("/", carController.getCarsForUser);
router.get(
    "/check-registry/:carId",
    checkCarWithId,
    validator(carSchema, "params"),
    carController.checkRegisteredForCar
);
router.get(
    "/check-error-by-id/:carId",
    checkCarWithId,
    validator(carSchema, "params"),
    carController.checkErrorById
);

router.get(
    "/errors-by-id/:carId",
    checkCarWithId,
    validator(carSchema, "params"),
    carController.getErrorById
);
router.get(
    "/errors-by-license-plate",
    validator(licensePlateSchema, "query"),
    carController.getErrorByLicensePlate
);
router.get("/category", carController.getCategories);
router.get("/types", validator(typeSchema, "query"), carController.getCarType);
router.get("/info", validator(carSchema, "query"), carController.getCarInformationWithId);
router.put("/info", checkCarWithId, validator(carSchema, "query"), carController.updateCar);
router.delete("/info", checkCarWithId, validator(carSchema, "query"), carController.deleteCar);

module.exports = router;
