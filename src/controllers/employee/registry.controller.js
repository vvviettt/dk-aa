const response = require("../../utils/response");
const registryService = require("../../services/registry.service");
const { sendToCustomerCompletedRegistry, sendToEmployeePaymentRegistry } = require("../../services/notification.service");

class RegistryController {
    getRegistryToday = async (req, res, next) => {
        try {
            const date = req.value.date;
            const registries = await registryService.getRegistriesWithDay(
                `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
                1,
                10
            );
            return res.status(200).json(response({ registries }, "success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };

    getRegistryInfo = async (req, res) => {
        try {
            const registry = await registryService.getRegistryInfo(req.value.id);
            return res.status(200).json(response({ registry }, "Success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
    getRegistries = async (req, res) => {
        try {
            const { type, date, page, limit } = req.value;
            const registries = await registryService.getRegistriesByType(
                type,
                `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
                page,
                limit
            );
            return res.status(200).json(response({ registries }, "success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
    payForRegistry = async (req, res) => {
        try {
            const { id, fee_5, fee_6, fee_7 } = req.value;
            await registryService.payForRegistry(id, fee_5, fee_6, fee_7);
            sendToEmployeePaymentRegistry(id)
            return res.status(200).json(response({}, "success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
    completeForRegistry = async (req, res) => {
        try {
            const { id, type, plan_date, cost_plan_date } = req.value;
            const update = await registryService.completeForRegistry(
                id,
                type,
                plan_date,
                cost_plan_date
            );
            if (update) {
                await registryService.handleAllInfringer(id);
            }
            await sendToCustomerCompletedRegistry(id, type);
            return res.status(200).json(response({}, "success", 1));
        } catch (error) {
            console.log(error);
            return res.status(200).json(response({}, error.message, 0));
        }
    };

    listRegistryDate = async (req, res, next) => {
        try {
            const dates = await registryService.getRegistriesFuture();
            return res.status(200).json(response({ rows: dates }, "success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
}

module.exports = new RegistryController();
