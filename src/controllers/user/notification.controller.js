const query = require("../../model/query.model");
const carService = require("../../services/car.service");
const {
    getAllNotifications,
    getNotificationsWithId,
    sendInfringes,
    checkNotification,
    updateStatusNo,
    getDetailNotification,
    sendNotifications,
} = require("../../services/notification.service");
const registryService = require("../../services/registry.service");
const response = require("../../utils/response");

const getNotifications = async (req, res, next) => {
    try {
        const user = req.user;
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const notifications = await getAllNotifications(user.id, limit, page);
        return res
            .status(200)
            .json(
                response({ rows: notifications, recordsTotal: notifications.length }, "Success", 1)
            );
    } catch (error) {
        return res.status(500).json(response({}, error.message, 0));
    }
};

const getNotificationInfo = async (req, res) => {
    try {
        const not = await getNotificationsWithId(req.query.id, req.user.id);
        const notification = not[0];
        console.log(notification);
        if (!notification) return res.status(200).json(response({}, "Không có thông báo này", 0));
        switch (notification.type) {
            case 1:
                const history = await registryService.getRegistriesByRegistryId(notification.registry_id);
                const errors = await carService.getAllErrorByLicensePlate(notification.data);
                notification.date = history ? history.plan_date : null;
                notification.errors = errors;
                break;
            case 2:
                const registry = await registryService.getRegistriesByRegistryId(
                    notification.registry_id
                );
                notification.date = registry.date;
                const lasterRegistry = await registryService.getLasterRegistry(notification.data,notification.registry_id);
                notification.planDate =
                    lasterRegistry !== undefined ? lasterRegistry.plan_date : null;
                break;
            case 4:
                const error = await carService.getAllErrorByLicensePlate(notification.data);
                notification.errors = error;
                break;
            case 6:
                const completeRegistry = await registryService.getCompleteRegistry(notification.registry_id);
                notification.detail = completeRegistry ? completeRegistry : null
                break;
            case 7:
                const failRegistry = await registryService.getCompleteRegistry(notification.registry_id);
                notification.detail = failRegistry ? failRegistry : null
                break;
            default:
                break;
        }
        return res.status(200).json(response({ ...notification }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const getStatusNotification = async (req, res) => {
    try {
        const status = await checkNotification(req.user.id);
        return res.status(200).json(response({ status: status }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const updateStatusNotification = async (req, res) => {
    try {
        const status = await updateStatusNo(req.user.id);
        return res.status(200).json(response({ status: status }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const test = async (req, res) => {
    try {
        const notifications = await sendNotifications();
        console.log(notifications);
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    getNotifications,
    getNotificationInfo,
    getStatusNotification,
    updateStatusNotification,
    test,
};
