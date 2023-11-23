const { login } = require("../controllers/user/auth.controller");
const query = require("../model/query.model");
const ApiError = require("../utils/ApiError");
const dateConvert = require("../utils/dateConvert");

class RegistryService {
    getRegistriesByUser = (userId, limit, page) => {
        return new Promise(async (resolve, reject) => {
            try {
                const data = {};
                const allowed_days_query = await query(
                    `SELECT allowed_days FROM other_configuration`
                );
                const days = -allowed_days_query[0].allowed_days;
                const registries = await query(
                    `select registry_managements.id , registry_managements.license_plate, registry_managements.address as registration_for, case when registry_managements.pay_at is null then 0 else  1 end  as status , vehicle_categories.name as type,car_images.url as display_image,
                o.cost, date(registry_managements.date ) as date , date(p.completed_at) as completed_at
                from registry_managements 
                inner join vehicle_types on registry_managements.vehicle_type_id= vehicle_types.id and registry_managements.owner_id=${userId} AND registry_managements.date > TIMESTAMPADD(DAY,${days},NOW()) AND registry_managements.completed_at IS null and registry_managements.delete_at is null
                inner join vehicle_categories on vehicle_categories.id=vehicle_types.vehicle_category_id
                inner join cars ON cars.license_plates = registry_managements.license_plate and cars.delete_at is null
                left join car_images ON car_images.car_id =cars.id
                LEFT join (SELECT * FROM registry_managements WHERE registry_managements.completed_at IS NOT NULL ORDER BY registry_managements.completed_at DESC limit 1) as p on p.license_plate = cars.license_plates
                inner join (select bills.registry_id, sum(bills.fee) as cost from bills  group by registry_id )as o on o.registry_id=registry_managements.id and o.registry_id=registry_managements.id GROUP BY registry_managements.id
                order by registry_managements.date desc LIMIT ${limit} OFFSET ${(page - 1) * limit}`
                );
                data.rows = this.sortRegistriesWithDay(registries);
                data.recordsTotal = registries.length;
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    };
    getAmountRegistries = (date) => {
        return new Promise(async (resolve, reject) => {
            try {
                const amount_registries = await query(
                    `SELECT COUNT(*) as amount_registries  FROM registry_managements WHERE date = '${date}' AND status = 0 `
                );
                resolve(amount_registries[0].amount_registries);
            } catch (err) {
                reject(err);
            }
        });
    };
    getNumberVehicles = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const number_vehicles = await query(
                    `SELECT number_vehicles FROM other_configuration`
                );
                resolve(number_vehicles[0].number_vehicles);
            } catch (err) {
                reject(err);
            }
        });
    };

    sortRegistriesWithDay = (registries) => {
        const result = [];
        const key = [];
        registries.map((registry) => {
            if (key.includes(registry.date)) {
                result[result.length - 1].list_registration.push(registry);
                return;
            }
            result.push({});
            key.push(registry.date);
            result[result.length - 1].date = registry.date;
            result[result.length - 1].list_registration = [registry];
            return;
        });
        return result;
    };

    calculationServiceCost = (address, distance) => {
        if (!address) {
            return 0;
        } else {
            return new Promise(async (resolve, reject) => {
                try {
                    const fees = await query(
                        `SELECT fee FROM fee_setting where ${distance} - fee_setting.from > 0 and ${distance} - fee_setting.to < 0`
                    );
                    if (!fees.length)
                        reject(new Error("Không nằm trong khảng cách có thể giao nhận hộ."));
                    resolve(fees[0].fee);
                } catch (error) {
                    reject(error);
                }
            });
        }
    };

    getFeeWithCarId = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const fees = await query(
                    `select cars.license_plates , vehicle_categories.tariff, vehicle_categories.license_fee , vehicle_types.road_fee from cars 
                inner join vehicle_types on cars.vehicle_type_id = vehicle_types.id and cars.id=${carId} and cars.delete_at is null
                inner join vehicle_categories on vehicle_categories.id = vehicle_types.vehicle_category_id ;`
                );
                if (!fees.length) reject(new Error("Không tìm thấy xe này"));
                resolve(fees[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getFeeForRegistry = async (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const fees = await query(
                    `select cars.license_plates , vehicle_categories.tariff, vehicle_categories.license_fee ,  vehicle_types.road_fee from cars 
                inner join vehicle_types on cars.vehicle_type_id = vehicle_types.id and cars.id=${carId} and cars.delete_at is null
                inner join vehicle_categories on vehicle_categories.id = vehicle_types.vehicle_category_id `
                );
                if (!fees.length) reject(new Error("Lỗi data"));
                resolve(fees[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    addNewRegistry = ({
        owner_id,
        license_plate,
        vehicle_type_id,
        address,
        date,
        owner_name,
        owner_phone,
        registry_time,
    }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const add = await query(
                    `INSERT INTO registry_managements(owner_id , license_plate ,vehicle_type_id , address , date , owner_name , owner_phone, registry_time ) VALUES ('${owner_id}', '${license_plate}','${vehicle_type_id}',${address}, '${date}' , '${owner_name}', '${owner_phone}', '${registry_time}');`
                );
                resolve(add.insertId);
            } catch (error) {
                reject(new Error(error));
            }
        });
    };

    addBillForRegistry = (tariff, licenseFee, roadFee, serviceCost, registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `INSERT INTO bills(fee , fee_type_id , registry_id) VALUES (${tariff} ,1 , ${registryId} ),(${serviceCost} ,2 , ${registryId} ), (${roadFee} ,3 , ${registryId} ), (${licenseFee} ,4 , ${registryId} )`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistriesFuture = async (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let dates;
                if (userId) {
                    dates = await query(
                        `SELECT date FROM registry_managements
                        inner join cars ON cars.license_plates = registry_managements.license_plate and cars.delete_at is null and registry_managements.delete_at IS null
                        and registry_managements.owner_id =${userId} and registry_managements.date > CURRENT_DATE AND registry_managements.completed_at is null GROUP BY date;`
                    );
                } else {
                    dates = await query(
                        `SELECT date FROM registry_managements where registry_managements.date > CURRENT_DATE AND registry_managements.completed_at is null and registry_managements.delete_at IS null GROUP BY date;`
                    );
                }

                resolve(dates);
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistriesByDate = (date, owner_id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registries =
                    await query(`select registry_managements.id , registry_managements.license_plate, registry_managements.address as registration_for, case when registry_managements.pay_at is null then 0 else  1 end  as status , vehicle_categories.name as type,car_images.url as display_image,
                o.cost, date(registry_managements.date ) as date , date(p.completed_at) as completed_at
                from registry_managements 
                inner join vehicle_types on registry_managements.vehicle_type_id= vehicle_types.id and registry_managements.owner_id=${owner_id} AND registry_managements.completed_at IS null AND registry_managements.date = '${date}' and registry_managements.delete_at is null
                inner join vehicle_categories on vehicle_categories.id=vehicle_types.vehicle_category_id
                inner join cars ON cars.license_plates = registry_managements.license_plate and cars.delete_at is null
                left join car_images ON car_images.car_id =cars.id
                LEFT join (SELECT * FROM registry_managements WHERE registry_managements.completed_at IS NOT NULL ORDER BY registry_managements.completed_at DESC limit 1) as p on p.license_plate = cars.license_plates
                inner join (select bills.registry_id, sum(bills.fee) as cost from bills  group by registry_id )as o on o.registry_id=registry_managements.id and o.registry_id=registry_managements.id GROUP BY registry_managements.id
                order by registry_managements.date desc;`);
                resolve(registries);
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistriesByRegistryId = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registry = await query(
                    `Select * from registry_managements where id = ${registryId} `
                );
                if (registry.length == 0) throw new Error("Không tìm thấy đăng kiểm")
                resolve(registry[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getLasterRegistry = (licensePlate,registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registry = await query(
                    `Select * from registry_managements where license_plate = '${licensePlate}' 
                    and delete_at is null and id < ${registryId} and completed_at is not null 
                    and plan_date is not null order by id DESC;`
                );
                resolve(registry[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCompleteRegistry = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registry = await query(
                    `Select registry_managements.* , car_images.url as carImage from registry_managements 
                    INNER JOIN cars  ON registry_managements.id = ${registryId} and registry_managements.license_plate = cars.license_plates
                    left JOIN car_images  ON cars.id = car_images.car_id limit 1`
                );
                resolve(registry[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getFeeWithRegistryId = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const fee = await query(`SELECT bills.fee , bills.fee_type_id FROM bills 
                INNER JOIN registry_managements on bills.registry_id =${registryId} AND registry_managements.id = bills.registry_id AND registry_managements.delete_at is null ORDER BY bills.fee_type_id;`);
                const convert = {};
                console.log(fee);
                fee.map((feeItem) => {
                    console.log(feeItem);
                    switch (feeItem.fee_type_id) {
                        case 1: {
                            convert.tariff = feeItem.fee;
                            break;
                        }
                        case 2: {
                            convert.serviceCost = feeItem.fee;
                            break;
                        }
                        case 3: {
                            convert.road_fee = feeItem.fee;
                            break;
                        }
                        case 4: {
                            convert.license_fee = feeItem.fee;
                            break;
                        }
                    }
                });
                console.log(convert);
                resolve(convert);
            } catch (error) {
                reject(error);
            }
        });
    };
    getBillWithRegistryId = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const fee = await query(`select  fee_type_id, name, fee
                from bills 
                inner join fee_types on bills.fee_type_id = fee_types.id
                inner join registry_managements on bills.registry_id = registry_managements.id
                and bills.registry_id = ${registryId}`);
                resolve(fee);
            } catch (error) {
                reject(error);
            }
        });
    };
    getRegistryProfile = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const registries = await query("select id, name, status from profile");
                resolve(registries);
            } catch (error) {
                reject(error);
            }
        });
    };
    getRegistryHotLine = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const registries = await query("select phone_number from hot_line");
                resolve(registries[0].phone_number);
            } catch (error) {
                reject(error);
            }
        });
    };

    updateRegistry = ({
        license_plate,
        vehicle_type_id,
        address,
        date,
        registry_id,
        registry_time,
    }) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `UPDATE registry_managements SET license_plate = '${license_plate}' , vehicle_type_id = ${vehicle_type_id} , address= ${address}, date='${date}',registry_time='${registry_time}' where id =${registry_id};
                    delete from bills where bills.registry_id = ${registry_id};`
                );
                resolve();
            } catch (error) {
                reject(new Error(error));
            }
        });
    };

    checkRegistryCompleted = (registryId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log();
                const registry = await query(
                    `SELECT * FROM registry_managements 
                    inner join cars on cars.license_plates = registry_managements.license_plate and cars.owner_id = ${userId} and
                     registry_managements.id = ${registryId} AND registry_managements.status=0 AND registry_managements.pay_at is null  and registry_managements.delete_at is null ;`
                );
                if (registry.length !== 1) {
                    reject("Không thể truy cập");
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    getListRegistryCompleted = (licensePlate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registries = await query(
                    `SELECT registry_managements.id, registry_managements.date, registry_managements.license_plate,registry_managements.address , registry_managements.payment_date , registry_managements.plan_date ,car_images.url  
                    FROM registry_managements 
                    INNER JOIN cars ON cars.license_plates='${licensePlate}' AND registry_managements.license_plate='${licensePlate}' AND registry_managements.completed_at is not null AND registry_managements.delete_at is  null and registry_managements.status =2
                    LEFT JOIN car_images ON cars.id= car_images.car_id GROUP BY registry_managements.id;`
                );
                resolve(registries);
            } catch (error) {
                reject(error);
            }
        });
    };

    deleteRegistry = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(registryId);
                await query(
                    `UPDATE registry_managements set delete_at = CURRENT_TIMESTAMP  where id = ${registryId}`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistriesWithDay = (date, page, limit) => {
        return new Promise(async (resolve, reject) => {
            try {
                let registries =
                    await query(`SELECT registry_managements.id ,case when registry_managements.pay_at is null then 0 else  1 end  as isPay, registry_managements.license_plate , car_images.url , vehicle_categories.name , registry_managements.address FROM registry_managements 
                    INNER JOIN vehicle_types ON registry_managements.vehicle_type_id = vehicle_types.id AND registry_managements.delete_at is null AND registry_managements.completed_at is null 
                    INNER JOIN vehicle_categories ON vehicle_types.vehicle_category_id = vehicle_categories.id  AND registry_managements.date = '${date}' AND vehicle_categories.delete_at is null 
                    LEFT JOIN cars on registry_managements.license_plate = cars.license_plates 
                    LEFT JOIN car_images ON car_images.car_id = cars.id and registry_managements.completed_at is null 
                    GROUP By registry_managements.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`);

                resolve(registries);
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistriesByType = (type, date, page, limit) => {
        return new Promise(async (resolve, reject) => {
            try {
                let statement = "";
                switch (type) {
                    case 0: {
                        statement =
                            "registry_managements.pay_at is null AND registry_managements.completed_at is null";
                        break;
                    }
                    case 1: {
                        statement =
                            "registry_managements.pay_at is not null AND registry_managements.completed_at is null";
                        break;
                    }
                    case 2: {
                        statement =
                            "registry_managements.status !=0 AND registry_managements.completed_at is not null";
                        break;
                    }
                    default: {
                        reject(new Error("Lỗi data"));
                        break;
                    }
                }
                let registries = await query(
                    `SELECT  registry_managements.id , registry_managements.owner_name , registry_managements.owner_phone , case when registry_managements.status =1 then 2 else  1 end  as status , registry_managements.license_plate , registry_managements.date FROM registry_managements 
                    WHERE registry_managements.delete_at is null AND registry_managements.date = '${date}' AND ${statement} 
                     LIMIT ${limit} OFFSET ${(page - 1) * limit}`
                );

                resolve(registries);
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistryInfo = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const registry = await query(
                    `SELECT registry_managements.id, registry_managements.owner_name , registry_managements.owner_phone, registry_managements.address , registry_managements.date,registry_managements.registry_time, 
                    registry_managements.staff_id, registry_managements.staff_name,registry_managements.car_delivery_time,registry_managements.date_birth,registry_managements.id_card,registry_managements.phone_number,
                vehicle_categories.name as category_name, vehicle_types.name as car_type ,cars.manufacture_at , car_images.url as carImages , users.avatar as userImage, registry_managements.license_plate FROM registry_managements 
                INNER JOIN vehicle_types ON registry_managements.vehicle_type_id=vehicle_types.id  AND registry_managements.id = ? AND registry_managements.delete_at is null
                INNER JOIN vehicle_categories ON vehicle_types.vehicle_category_id= vehicle_categories.id
                LEFT JOIN cars ON cars.license_plates = registry_managements.license_plate
                LEFT JOIN car_images ON car_images.id = cars.id
                LEFT JOIN users ON registry_managements.owner_id=users.id
                GROUP BY car_images.url;`,
                    [id]
                );
                if (!registry.length) return reject(new Error("Đăng kiểm không hợp lệ."));
                resolve(registry[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    payForRegistry = (id, fee_5, fee_6, fee_7) => {
        const value = [
            [
                [fee_5, 5, id],
                [fee_6, 6, id],
                [fee_7, 7, id],
            ],
        ];
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `UPDATE registry_managements SET registry_managements.pay_at = CURRENT_TIMESTAMP WHERE registry_managements.id = ${id} AND registry_managements.delete_at is null AND registry_managements.pay_at is null;`
                );
                await query("INSERT INTO bills (fee, fee_type_id, registry_id) VALUES ?;", value);
                resolve();
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    };

    completeForRegistry = (registryId, type, planDate, costPlanDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (type === 0) {
                    await query(`UPDATE registry_managements 
                    SET registry_managements.status= 1 ,  registry_managements.completed_at = CURRENT_TIMESTAMP where registry_managements.id = ${registryId} AND registry_managements.pay_at is not null AND registry_managements.completed_at is null and registry_managements.delete_at is null ;`);
                    resolve(null);
                } else {
                    const rs = await query(`UPDATE registry_managements 
                SET registry_managements.status= 2, registry_managements.payment_date ='${dateConvert(
                    costPlanDate
                )}', registry_managements.plan_date = '${dateConvert(
                        planDate
                    )}', registry_managements.completed_at = CURRENT_TIMESTAMP  
                WHERE registry_managements.id = ${registryId} AND registry_managements.pay_at is not null AND registry_managements.completed_at is null and registry_managements.delete_at is null ;`);
                    resolve(rs.changedRows);
                }
            } catch (error) {
                reject(error);
            }
        });
    };
    handleAllInfringer = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `UPDATE  infringes INNER JOIN registry_managements ON registry_managements.license_plate = infringes.license_plate AND registry_managements.id = ${id}
                    SET infringes.status=1;`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    completeForInfringer = (registryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(`UPDATE  infringes INNER JOIN registry_managements ON registry_managements.license_plate = infringes.license_plate AND registry_managements = ${registryId}
                            SET infringes.status=1`);
                resolve();
            } catch (error) {
                login();
                reject(error);
            }
        });
    };
}
const registryService = new RegistryService();
module.exports = registryService;
