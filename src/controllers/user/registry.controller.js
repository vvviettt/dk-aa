const httpStatus = require("http-status");
const carService = require("../../services/car.service");
const registryService = require("../../services/registry.service");
const response = require("../../utils/response");
const dateConvert = require("../../utils/dateConvert");
const { sendToEmployeeRegistry } = require("../../services/notification.service");

const getRegistries = async (req, res, next) => {
    try {
        const user = req.user;
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const registries = await registryService.getRegistriesByUser(user.id, limit, page);
        return res.status(httpStatus.OK).json(response(registries, "Success", 1));
    } catch (error) {
        res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const costCalculation = async (req, res) => {
    try {
        const data = req.value;
        const serviceCost = await registryService.calculationServiceCost(
            data.address,
            data.distance
        );
        const feeRegistration = await registryService.getFeeWithCarId(data.carId);
        return res.status(httpStatus.OK).json(
            response(
                {
                    fee: {
                        tariff: feeRegistration.tariff,
                        license_fee: feeRegistration.license_fee,
                        road_fee: feeRegistration.road_fee,
                        serviceCost: serviceCost,
                    },
                },
                "Success",
                1
            )
        );
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const addNewRegistry = async (req, res) => {
    try {
        const { address, carId, date, tariff, license_fee, road_fee, serviceCost, registry_time } =
            req.value;
        const checkError = await carService.checkErrorWithId(carId);
        await carService.getRegistryNoCompleted(carId);
        // const serviceCost = registryService.calculationServiceCost(address);
        // const feeRegistration = await registryService.getFeeForRegistry(carId, req.value.feeTime);
        const car = await carService.getCarWithId(carId);
        const registryId = await registryService.addNewRegistry({
            owner_id: req.user.id,
            license_plate: car.license_plates,
            vehicle_type_id: car.vehicle_type_id,
            address: address ? `'${address}'` : null,
            date: dateConvert(date),
            owner_name: req.user.name,
            owner_phone: req.user.phone,
            registry_time: registry_time ? registry_time : "08:00",
        });
        await registryService.addBillForRegistry(
            tariff,
            license_fee,
            road_fee,
            serviceCost,
            registryId
        );
        await sendToEmployeeRegistry(car.license_plates, registryId);
        return res.status(200).json(response({}, "Đăng ký thành công", checkError.status ? 1 : 2));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const updateRegistry = async (req, res) => {
    try {
        const { address, carId, date, tariff, license_fee, road_fee, serviceCost, registry_time } =
            req.value;
        await registryService.checkRegistryCompleted(req.registry.id, req.user.id);
        // const checkError = await carService.checkErrorWithId(carId);
        // const serviceCost = registryService.calculationServiceCost(address);
        // const feeRegistration = await registryService.getFeeForRegistry(carId, req.value.feeTime);
        const car = await carService.getCarWithId(carId);
        await registryService.updateRegistry({
            license_plate: car.license_plates,
            vehicle_type_id: car.vehicle_type_id,
            address: address ? `'${address}'` : null,
            date: dateConvert(date),
            registry_id: req.registry.id,
            registry_time: registry_time,
        });
        await registryService.addBillForRegistry(
            tariff,
            license_fee,
            road_fee,
            serviceCost,
            req.registry.id
        );
        return res.status(200).json(response({}, "Cập nhật thành công", 1));
    } catch (error) {
        return res.status(200).json(response({}, "Cập nhật thất bại", 0));
    }
};

const deleteRegistry = async (req, res) => {
    try {
        await registryService.deleteRegistry(req.query.registryId);
        return res.status(200).json(response({}, "Xóa thành công", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const getRegistriesInFuture = async (req, res) => {
    try {
        const dates = await registryService.getRegistriesFuture(req.user.id);
        return res.status(200).json(response({ rows: dates }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message, 0));
    }
};

const getRegistriesWithDate = async (req, res) => {
    try {
        const { date } = req.value;
        const registries = await registryService.getRegistriesByDate(
            dateConvert(date),
            req.user.id
        );
        return res
            .status(200)
            .json(response({ rows: registries, recordsTotal: registries.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, "Lỗi máy chủ", 0));
    }
};

const getRegistryInfo = async (req, res) => {
    try {
        const registry = req.registry;
        const fee = await registryService.getFeeWithRegistryId(req.registry.id);
        const car = await carService.getCarWithLicensePlate(registry.license_plate);
        console.log(registry);
        return res.status(200).json(
            response(
                {
                    id: registry.id,
                    license_plate: registry.license_plate,
                    carId: car.id,
                    date: registry.date,
                    registry_time: registry.registry_time,
                    address: registry.address,
                    completedAt: registry.completed_at,
                    isPay: registry.pay_at ? 1 : 0,
                    paymentAt: registry.payment_date,
                    planDate: registry.plan_date,
                    fee: fee,
                    staff: registry.staff_id
                        ? {
                              user_name: registry.staff_id,
                              name: registry.staff_name,
                              date_birth: registry.date_birth,
                              id_card: registry.id_card,
                              phone_number: registry.phone_number,
                              car_delivery_time: registry.car_delivery_time,
                          }
                        : null,
                },
                "Success",
                1
            )
        );
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
const getRegistryBill = async (req, res) => {
    try {
        const registry = req.registry;
        const bill = await registryService.getBillWithRegistryId(req.registry.id);
        return res.status(200).json(
            response(
                {
                    bill,
                },
                "Success",
                1
            )
        );
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const getRegistryProfile = async (req, res, next) => {
    try {
        const registries = await registryService.getRegistryProfile();
        return res
            .status(200)
            .json(response({ profile: registries, recordsTotal: registries.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};
const getRegistryHotLine = async (req, res, next) => {
    try {
        const registries = await registryService.getRegistryHotLine();
        return res.status(200).json(response({ hot_line: registries }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};
const checkNumberVehicles = async (req, res) => {
    try {
        const amount_registries = await registryService.getAmountRegistries(
            dateConvert(req.value.date)
        );
        const number_vehicles = await registryService.getNumberVehicles();
        return res.status(200).json(response({ amount_registries, number_vehicles }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const getRegistryHistory = async (req, res) => {
    try {
        const registries = await registryService.getListRegistryCompleted(req.car.license_plates);
        return res.status(200).json(response(registries, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
module.exports = {
    getRegistryInfo,
    getRegistries,
    costCalculation,
    addNewRegistry,
    getRegistriesInFuture,
    getRegistriesWithDate,
    updateRegistry,
    deleteRegistry,
    getRegistryHistory,
    getRegistryProfile,
    checkNumberVehicles,
    getRegistryHotLine,
    getRegistryBill,
};
