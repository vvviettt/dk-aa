const {
    checkNotification,
    updateStatusNo,
    getAllNotifications,
    getDetailNotification,
    sendInfringes,
    sendAssignmentNotificationService,
    sendToEmployeePaymentRegistry,
    sendToCustomerCompletedRegistry,
} = require("../../services/notification.service");
const {
    getUserByUsername
} = require("../../services/user.service");
const response = require("../../utils/response");

const sendInfringesNotification = async (req, res) => {
    try {
        const { licensePlate, key } = req.value;
        if (key != process.env.NOTIFICATION_SECRET_KEY) 
            return res.status(200).json(response({}, "Key không chính xác", 0));
        await sendInfringes(licensePlate);
        return res.status(200).json(response({}, "success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const sendPaymentNotification = async (req,res) => {
    try {
        const { registryId, key } = req.body;
        if (key != process.env.NOTIFICATION_SECRET_KEY) 
            return res.status(200).json(response({}, "Key không chính xác", 0));
        await sendToEmployeePaymentRegistry(registryId)
        return res.status(200).json(response({}, "success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
}

const sendAssignmentNotification = async (req, res) => {
    try {
        const { userName, registryId , oldUser ,key } = req.body;
        if (key != process.env.NOTIFICATION_SECRET_KEY) 
        return res.status(200).json(response({}, "Key không chính xác", 0));
        if (userName != oldUser){
            const user = await getUserByUsername({username : userName, role: 3})   
            const userBefore = await getUserByUsername({username : oldUser, role: 3})  
            await sendAssignmentNotificationService(registryId,user.id,userBefore?.id);
            return res.status(200).json(response({}, "success", 1));
        }else{
            return res.status(200).json(response({}, "Không thay đổi người phân công", 0));
        }
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const sendCompleteNotification = async (req,res) => {
    try {
        const { registryId, type, key } = req.body;
        if (key != process.env.NOTIFICATION_SECRET_KEY) 
        return res.status(200).json(response({}, "Key không chính xác", 0));
        await sendToCustomerCompletedRegistry(registryId, type);
        return res.status(200).json(response({}, "success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
}

const getListNotifications = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const notifications = await getAllNotifications(req.user.id, limit, page);
        return res
            .status(200)
            .json(
                response({ rows: notifications, recordsTotal: notifications.length }, "Success", 1)
            );
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const notificationDetails = async (req, res) => {
    try {
        const { id } = req.value;
        const userId = req.user.id;
        const detail = await getDetailNotification(userId, id);
        return res.status(200).json(response({ detail: detail }, "Success", 1));
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
module.exports = {
    sendInfringesNotification,
    getListNotifications,
    notificationDetails,
    getStatusNotification,
    updateStatusNotification,
    sendAssignmentNotification,
    sendPaymentNotification,
    sendCompleteNotification
};
