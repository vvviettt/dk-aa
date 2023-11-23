const query = require("../model/query.model");
const CronJob = require("node-cron");
const { Expo } = require("expo-server-sdk");
const timeConvert = require("../utils/timeConvert");
const carService = require("./car.service");
const registryService = require("./registry.service");
const { getUserByUsername } = require("./user.service");
const { getMessaging } = require("firebase-admin/messaging");

const notificationHandle = async () => {
    const scheduledNotifications = CronJob.schedule("0 * * * * *", async () => {
        console.log(Date.now());
        try {
            const timeConfig = await getTimeSendNotification();
            console.log("HIHI", timeConfig);
            if (timeConfig[0].status) {
                const date = new Date(
                    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
                );
                console.log(timeConvert(date));
                if (timeConvert(date) === timeConfig[0].time) {
                    const registryDevice = await getDeviceForRegistry(
                        timeConfig[0].day_before_registry + 1
                    );
                    const expiredDevice = await getDeviceForExpired(
                        timeConfig[0].day_before_expired + 1
                    );
                    console.log(registryDevice, expiredDevice);
                    if (registryDevice.length) {
                        await saveNotifications(convertDataToArray(registryDevice, "REGISTRY"));
                    }
                    if (expiredDevice.length) {
                        await saveNotifications(convertDataToArray(expiredDevice, "EXPIRED"));
                    }
                    await sendNotifications();
                    await updateSendStatus();
                    await changeNotificationStatus();
                    if (expiredDevice.length || registryDevice.length) {
                        console.log("ok");
                        await changeNotificationStatus(
                            convertStatusOfNotification([...expiredDevice, ...registryDevice])
                        );
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    });

    scheduledNotifications.start();
};

const sendNotifications = () => {
    // console.log("send");
    return new Promise(async (resolve, reject) => {
        try {
            const notifications = await query(
                `SELECT notifications.id , notifications.content as body , notifications.user_id , notifications.data ,notifications.notification_type_id as type, device_tokens.token , notification_types.name as title
                FROM notifications INNER JOIN device_tokens ON device_tokens.user_id = notifications.user_id AND notifications.is_send =0
                INNER JOIN notification_types ON notification_types.id = notifications.notification_type_id`
            );
            sendNotification(notifications);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

const updateSendStatus = () => {
    // console.log("update");
    return new Promise(async (resolve, reject) => {
        try {
            await query(
                `Update notifications  set  notifications.is_send =1 WHERE  notifications.is_send =0`
            );
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

const convertStatusOfNotification = (data) => {
    const list = data.map((item) => {
        return item.user_id;
    });
    const rs = [];
    for (let i = 0; i < list.length; i++) {
        if (!rs.includes(list[i])) {
            rs.push(list[i]);
        }
    }
    return rs;
};

const changeNotificationStatus = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data) {
                await query(`Update users set have_notification = 1 where id = ?`, data);
            } else {
                await query(`Update users set have_notification = 1 where users.role_id =3`);
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

const getDeviceOfEmployee = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const tokens = await query(
                "SELECT device_tokens.* FROM device_tokens INNER JOIN users ON users.id = device_tokens.user_id and users.role_id =3;"
            );
            return resolve(tokens);
        } catch (error) {
            reject(error);
        }
    });
};

const sendToEmployeeRegistry = (license_plates, registryId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getDeviceOfEmployee();
            const props = {
                license_plate: license_plates,
                registryId: registryId,
            };
            const data = handleDataMessage(token, "NEW_REGISTRY", license_plates);
            const notification = convertDataToArray(token, "NEW_REGISTRY", props);
            await saveNotifications(notification);
            await sendNotifications();
            await updateSendStatus();
            await changeNotificationStatus();
            console.log(notification);
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

const getDeviceOfCustomerByPhone = (phone) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tokens = await query(
                `SELECT device_tokens.* FROM device_tokens INNER JOIN users ON users.id = device_tokens.user_id and users.phone ='${phone}';`
            );
            return resolve(tokens);
        } catch (error) {
            reject(error);
        }
    });
};

const getDeviceOfCustomerById = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tokens = await query(
                `SELECT * FROM registration.device_tokens where user_id = '${userId}';`
            );
            return resolve(tokens);
        } catch (error) {
            reject(error);
        }
    });
};

const sendAssignmentNotificationService = (registry_id, userId, oldUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const registry = await registryService.getRegistryInfo(registry_id);
            const token = await getDeviceOfCustomerById(userId);
            if (registry.staff_id == null) throw new Error("Đăng kiểm chưa được phân công");
            const data = handleDataMessage(token, "ASSIGNMENT", registry);
            const notification = convertDataToArray(token, "ASSIGNMENT", registry);
            if (oldUserId) {
                const token = await getDeviceOfCustomerById(oldUserId);
                const notification = convertDataToArray(token, "CHANGE_ASSIGNMENT", registry);
                if (token.length == 0) {
                    await saveNotifications([
                        [
                            10,
                            oldUserId,
                            `Phân công nhận xe ${registry.license_plate} đã được thay đổi`,
                            registry.id,
                            0,
                        ],
                    ]);
                } else {
                    await saveNotifications(notification);
                }
            }
            if (token.length == 0) {
                await saveNotifications([
                    [
                        8,
                        userId,
                        `Bạn được phân công nhận xe ${
                            registry.license_plate
                        } lúc ${registry.car_delivery_time.slice(0, 5)} ngày ${registry.date
                            .split("-")
                            .reverse()
                            .join("/")} tại ${registry.address}`,
                        registry.id,
                        0,
                    ],
                ]);
            } else {
                await saveNotifications(notification);
            }
            await sendNotifications();
            await updateSendStatus();
            await changeNotificationStatus();
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

const sendToCustomerCompletedRegistry = (registry_id, type) => {
    return new Promise(async (resolve, reject) => {
        try {
            const registry = await registryService.getRegistryInfo(registry_id);
            const token = await getDeviceOfCustomerByPhone(registry.owner_phone);
            const data = handleDataMessage(
                token,
                type == 0 ? "FAIL_REGISTRY" : "COMPLETED_REGISTRY",
                registry.license_plate
            );
            const notification = convertDataToArray(
                token,
                type == 0 ? "FAIL_REGISTRY" : "COMPLETED_REGISTRY",
                registry
            );
            await saveNotifications(notification);
            await sendNotifications();
            await updateSendStatus();
            await changeNotificationStatus();
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

const sendToEmployeePaymentRegistry = (registry_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const registry = await registryService.getRegistryInfo(registry_id);
            const user = await getUserByUsername({ username: registry.staff_id, role: 3 });
            if (user) {
                const token = await getDeviceOfCustomerById(user.id);
                const data = handleDataMessage(token, "PAYMENT", registry);
                const notification = convertDataToArray(token, "PAYMENT", registry);
                if (token.length == 0) {
                    await saveNotifications([
                        [
                            9,
                            user.id,
                            `Xe ${registry.license_plate} đã hoàn thành phí và lệ phí`,
                            registry.id,
                            0,
                        ],
                    ]);
                } else {
                    await saveNotifications(notification);
                    await sendNotifications();
                    await updateSendStatus();
                    await changeNotificationStatus();
                }
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

const checkNotification = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const status = await query("SELECT have_notification FROM users WHERE id = ?", userId);
            resolve(status[0].have_notification);
        } catch (error) {
            reject(error);
        }
    });
};

const updateStatusNo = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            await query("UPDATE users SET have_notification = 0 WHERE id = ?", userId);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

const getAllNotifications = (userId, limit, page) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notifications = await query(
                `SELECT id , notification_type_id as type ,content, is_read, data , create_at as time FROM notifications WHERE user_id = ${userId} ORDER BY notifications.create_at DESC LIMIT ${limit} OFFSET ${
                    (page - 1) * limit
                };`
            );
            resolve(notifications);
        } catch (error) {
            reject(error);
        }
    });
};

const sendInfringes = (licensePlate) => {
    let result = "";
    for (let index = 0; index < licensePlate.length; index++) {
        const element = licensePlate[index];
        if (
            (index == licensePlate.length - 1 && index != 0) ||
            (index == 0 && licensePlate.length == 1)
        ) {
            result += `cars.license_plates = '${element}'`;
        } else {
            result += `cars.license_plates = '${element}' or `;
        }
    }
    return new Promise(async (resolve, reject) => {
        try {
            const tokens =
                await query(`SELECT users.id as user_id , cars.license_plates ,device_tokens.token  FROM cars 
            INNER JOIN users ON cars.owner_id = users.id AND (${result})
            INNER JOIN device_tokens ON device_tokens.user_id = users.id AND cars.delete_at is null GROUP BY cars.license_plates ,device_tokens.token ; `);
            if (tokens.length) {
                await saveNotifications(convertDataToArray(tokens, "INFRINGES"));
                await sendNotifications();

                await changeNotificationStatus(convertStatusOfNotification([...tokens]));
                setTimeout(async () => {
                    await updateSendStatus();
                }, 1000);
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

const saveNotifications = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.length || data.length == 0) {
                resolve();
            } else {
                await query(
                    "INSERT INTO notifications (notification_type_id , user_id , content , data, registry_id , is_send) VALUES ?",
                    [data]
                );
                const users = data.map((item) => item.user_id);
                console.log("userId:", users);
                await changeNotificationStatus(users);
            }
            resolve();
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
};

const getTimeSendNotification = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const config = await query(
                "SELECT status, notification_setting.day_before_registry , notification_setting.day_before_expired , notification_setting.time FROM `notification_setting` limit 1;"
            );
            resolve(config);
        } catch (error) {
            reject(error);
        }
    });
};

const getDeviceForRegistry = async (time) => {
    return new Promise(async (resolve, reject) => {
        try {
            const devices =
                await query(`SELECT device_tokens.* , registry_managements.date , registry_managements.license_plate,registry_managements.id as registry_id FROM device_tokens 
                INNER JOIN registry_managements on registry_managements.owner_id=device_tokens.user_id and registry_managements.completed_at is null and 
                datediff( registry_managements.date,CURRENT_DATE)>0 AND datediff( registry_managements.date,CURRENT_DATE)<${time} 
                GROUP BY registry_managements.license_plate , device_tokens.token;
        `);
            resolve(devices);
        } catch (error) {
            reject(error);
        }
    });
};

const getDeviceForExpired = async (time) => {
    return new Promise(async (resolve, reject) => {
        try {
            const devices =
                await query(`SELECT device_tokens.* , registry_managements.license_plate , registry_managements.plan_date 
                as date,registry_managements.id as registry_id FROM device_tokens 
                INNER JOIN registry_managements ON registry_managements.owner_id = device_tokens.user_id 
                AND datediff(registry_managements.plan_date , CURRENT_DATE) >=0 
                AND datediff(registry_managements.plan_date , CURRENT_DATE)<${time} 
                INNER JOIN cars ON cars.delete_at is null and cars.license_plates = registry_managements.license_plate
                GROUP BY registry_managements.license_plate, device_tokens.token;`);
            resolve(devices);
        } catch (error) {
            reject(error);
        }
    });
};

// getNotificationInfo;

const getNotificationsWithId = (id, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notifications = await query(
                `SELECT id ,data,content, notification_type_id as type, create_at, registry_id FROM notifications WHERE id = ${id} and user_id = ${userId};
                UPDATE notifications SET notifications.is_read = 1 WHERE notifications.id =${id} and notifications.user_id = ${userId}`
            );
            resolve(notifications[0]);
        } catch (error) {
            reject(error);
        }
    });
};

const getDetailNotification = (userId, notificationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notification = await query(
                "Select * from notifications where user_id = ? and id = ?;",
                [userId, notificationId]
            );
            await query(
                "Update notifications SET notifications.is_read = 1 WHERE notifications.id = ?;",
                [notificationId]
            );
            if (notification.length === 0) {
                reject(new Error("Không có quyền truy cập"));
            }
            const type = notification[0].notification_type_id;
            let result = {};
            console.log(userId, "  ", notificationId);
            switch (type) {
                case 5:
                case 8:
                case 9:
                case 10:
                    const detail = await query(
                        `SELECT notifications.id , notifications.notification_type_id AS type , registry_managements.*, 
                        bills.fee as serviceCost FROM notifications
                        INNER JOIN registry_managements on notifications.registry_id = registry_managements.id
                        INNER JOIN bills on bills.registry_id = registry_managements.id and bills.fee_type_id = 2
                        WHERE notifications.id = ?;`,
                        [notificationId]
                    );
                    const infringes = await carService.getAllErrorByLicensePlate(
                        detail[0]?.license_plates
                    );
                    result = { ...detail[0], infringes: infringes };
                    break;
                default:
                    break;
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

const sendNotification = (data) => {
    let messages = [];
    for (let push of data) {
        getMessaging()
            .send({
                data: {
                    data: JSON.stringify({
                        status: 1,
                        message: "Success",
                        detail: {
                            notiId: push.id,
                            type: push.type,
                            license_plate: push.data,
                        },
                    }),
                },
                token: push.token,
                notification: {
                    title: push.title,
                },
            })
            .then(() => {
                console.log("Success");
            })
            .catch(() => {
                console.log("Error");
            });
    }
};

const handleDataMessage = (data, type, props) => {
    const result = [];
    switch (type) {
        case "REGISTRY": {
            data.forEach((a) => {
                const date = new Date(a.date);
                result.push({
                    title: "Nhắc lịch đăng kiểm",
                    body: `Xe ${a.license_plate} có lịch đăng kiểm vào ngày ${date.getDate()}/${
                        date.getMonth() + 1
                    }/${date.getFullYear()}.`,
                    token: a.token,
                    data: a.license_plate,
                });
            });
            break;
        }
        case "EXPIRED": {
            data.forEach((a) => {
                const date = new Date(a.date);
                result.push({
                    title: "Xe hết hạn đăng kiểm",
                    body: `Xe ${a.license_plate} sẽ hết hạn đăng kiểm vào ngày  ${date.getDate()}/${
                        date.getMonth() + 1
                    }/${date.getFullYear()}.`,
                    token: a.token,
                    data: a.license_plate,
                });
            });
            break;
        }
        case "INFRINGES": {
            data.forEach((a) => {
                result.push({
                    title: "Lỗi vi phạm",
                    body: `Xe ${a.license_plates} có lỗi vi phạm vừa mới cập nhật.`,
                    token: a.token,
                    data: a.license_plates,
                });
            });
            break;
        }
        case "NEW_REGISTRY": {
            data.forEach((a) => {
                result.push({
                    title: "Có đăng kiểm mới",
                    body: `Xe ${props} vừa đăng kí đăng kiểm`,
                    token: a.token,
                    data: props,
                });
            });
            break;
        }
        case "COMPLETED_REGISTRY": {
            data.forEach((a) => {
                result.push({
                    title: "Có xe đạt đăng kiểm",
                    body: `Xe ${props} của bạn vừa đạt đăng kiểm`,
                    token: a.token,
                    data: props,
                });
            });
            break;
        }
        case "FAIL_REGISTRY": {
            data.forEach((a) => {
                result.push({
                    title: "Có xe không đạt đăng kiểm",
                    body: `Xe ${props} của bạn vừa không đạt đăng kiểm`,
                    token: a.token,
                    data: props,
                });
            });
            break;
        }
        case "ASSIGNMENT": {
            data.forEach((a) => {
                result.push({
                    title: "Phân công đăng kiểm hộ",
                    body: `Bạn được phân công nhận xe ${props.license_plate} lúc ${props.car_delivery_time} ngày 
                    ${props.date} tại số ${props.address}`,
                    token: a.token,
                    data: props,
                });
            });
            break;
        }
        case "PAYMENT": {
            data.forEach((a) => {
                result.push({
                    title: "Xe đã hoàn thành phí và lệ phí",
                    body: `Xe ${props.license_plate} đã hoàn thành phí và lệ phí`,
                    token: a.token,
                    data: props,
                });
            });
            break;
        }
    }
    return result;
};

const convertDataToArray = (data, type, props) => {
    const result = [];
    const count = [];
    switch (type) {
        case "REGISTRY": {
            data.forEach((a) => {
                if (count.includes(a.license_plate)) {
                    return;
                }
                count.push(a.license_plate);
                const date = new Date(a.date);
                result.push([
                    2,
                    a.user_id,
                    `Xe ${a.license_plate} của bạn có lịch đăng kiểm vào ngày ${date.getDate()}/${
                        date.getMonth() + 1
                    }/${date.getFullYear()}.`,
                    a.license_plate,
                    a.registry_id,
                    0,
                ]);
            });
            break;
        }
        case "EXPIRED": {
            data.forEach((a) => {
                if (count.includes(a.license_plate)) {
                    return;
                }
                count.push(a.license_plate);
                const date = new Date(a.date);
                result.push([
                    1,
                    a.user_id,
                    `Xe ${
                        a.license_plate
                    } của bạn sẽ hết hạn đăng kiểm vào ngày  ${date.getDate()}/${
                        date.getMonth() + 1
                    }/${date.getFullYear()}.`,
                    a.license_plate,
                    a.registry_id,
                    0,
                ]);
            });
            break;
        }
        case "INFRINGES": {
            data.forEach((a) => {
                if (count.includes(a.license_plate)) {
                    return;
                }
                count.push(a.license_plate);
                result.push([
                    4,
                    a.user_id,
                    `Xe ${a.license_plates} có lỗi vi phạm vừa mới cập nhật`,
                    a.license_plates,
                    0,
                    0,
                ]);
            });
            break;
        }
        case "NEW_REGISTRY": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    5,
                    a.user_id,
                    `Xe ${props.license_plates} vừa đăng kí đăng kiểm`,
                    props.license_plates,
                    props.registryId,
                    0,
                ]);
            });
            break;
        }
        case "COMPLETED_REGISTRY": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    6,
                    a.user_id,
                    `Xe ${props.license_plate} đạt đăng kí đăng kiểm`,
                    props.license_plate,
                    props.id,
                    0,
                ]);
            });
            break;
        }
        case "FAIL_REGISTRY": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    7,
                    a.user_id,
                    `Xe ${props.license_plate} không đạt đăng kí đăng kiểm`,
                    props.license_plate,
                    props.id,
                    0,
                ]);
            });
            break;
        }
        case "ASSIGNMENT": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    8,
                    a.user_id,
                    `Bạn được phân công nhận xe ${
                        props.license_plate
                    } lúc ${props.car_delivery_time.slice(0, 5)} ngày ${props.date
                        .split("-")
                        .reverse()
                        .join("/")} tại số ${props.address}`,
                    props.license_plate,
                    props.id,
                    0,
                ]);
            });
            break;
        }
        case "PAYMENT": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    9,
                    a.user_id,
                    `Xe ${props.license_plate} đã hoàn thành phí và lệ phí`,
                    props.license_plate,
                    props.id,
                    0,
                ]);
            });
            break;
        }
        case "CHANGE_ASSIGNMENT": {
            data.forEach((a) => {
                if (count.includes(a.user_id)) {
                    return;
                }
                count.push(a.user_id);
                result.push([
                    10,
                    a.user_id,
                    `Phân công nhận xe ${props.license_plate} đã được thay đổi`,
                    props.license_plate,
                    props.id,
                    0,
                ]);
            });
            break;
        }
    }
    return result;
};
module.exports = {
    getAllNotifications,
    notificationHandle,
    getNotificationsWithId,
    sendInfringes,
    sendToEmployeeRegistry,
    checkNotification,
    updateStatusNo,
    getDetailNotification,
    sendNotifications,
    sendToCustomerCompletedRegistry,
    getDeviceOfCustomerByPhone,
    sendAssignmentNotificationService,
    getDeviceOfCustomerById,
    sendToEmployeePaymentRegistry,
};
