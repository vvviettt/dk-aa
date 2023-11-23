const { reject } = require("bcrypt/promises");
const connection = require("../model/connection.model");
const query = require("../model/query.model");
const ApiError = require("../utils/ApiError");
const response = require("../utils/response");

class CarService {
    getCarsForUser = (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cars = await query(
                    `SELECT cars.id , vehicle_types.name as type, cars.license_plates,car_images.url as display_image , registry_managements.date , registry_managements.plan_date 
                    FROM registration.cars 
                    inner join registration.vehicle_types on cars.delete_at is null and cars.vehicle_type_id = vehicle_types.id and cars.owner_id = ${userId}
                    LEFT JOIN car_images ON car_images.car_id = cars.id 
                    LEFT JOIN
                    (
                    SELECT MAX(registry_managements.id) as id ,registry_managements.license_plate FROM registry_managements
                    WHERE registry_managements.owner_id = ${userId} AND registry_managements.completed_at is not null
                    GROUP BY registry_managements.license_plate 
                    ) as o ON o.license_plate = cars.license_plates 
                    LEFT JOIN registry_managements ON registry_managements.id = o.id
                    GROUP BY cars.id;`
                );
                resolve(cars);
            } catch (error) {
                reject(error);
            }
        });
    };

    getRegistryNoCompleted = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const allowed_days_query = await query(
                    `SELECT allowed_days FROM other_configuration`
                );
                const days = -allowed_days_query[0].allowed_days;
                const result = await query(
                    `select count(*) as count from cars inner join registry_managements on cars.license_plates = registry_managements.license_plate 
                    and cars.id = ${carId} and registry_managements.completed_at is  null 
                    and registry_managements.delete_at is null AND registry_managements.date > TIMESTAMPADD(DAY,${days},NOW()) `
                );
                if (result[0].count) {
                    reject(new Error("Xe có đăng kiểm chưa hoàn thành"));
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    checkErrorWithId = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await query(
                    `select count(*) as count from cars 
                inner join infringes on cars.license_plates = infringes.license_plate and cars.id = ${carId} and infringes.status=0`
                );
                if (result[0].count) {
                    resolve({
                        message: "Xe có lỗi vi phạm. Vui lòng kiểm tra lại và xử lí",
                        status: 0,
                    });
                }
                resolve({ status: 1 });
            } catch (error) {
                reject(error);
            }
        });
    };

    checkRegistryWithId = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const count = await query(
                    // `SELECT COUNT(*) as count FROM cars 
                    // INNER JOIN registry_managements ON cars.id= ? AND cars.license_plates=registry_managements.license_plate and registry_managements.delete_at is null and registry_managements.date > CURDATE();`,
                    `SELECT COUNT(*) as count FROM cars                     
                    INNER JOIN registry_managements 
                    ON cars.id= ? AND cars.license_plates=registry_managements.license_plate 
                    and registry_managements.delete_at is null
                    and registry_managements.completed_at is null;`,
                    id
                );
                if (count[0].count)
                    return reject(new Error("Xe đã đăng kiểm. Không được cập nhật."));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    getAllErrorById = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const errors = await query(
                    `select infringes.id, infringes.infringes_name as name , infringes.infringe_date as date ,infringes.handling_agency as handlingAgency    from infringes
                inner join cars on cars.license_plates = infringes.license_plate and cars.id = ${carId} and infringes.status=0`
                );
                resolve(errors);
            } catch (error) {
                reject(error);
            }
        });
    };

    getAllErrorByLicensePlate = (licensePlate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const infringes = await query(
                    `select infringes.id, infringes.infringes_name as name , infringes.infringe_date as date,infringes.handling_agency as handlingAgency  from infringes where infringes.license_plate = '${licensePlate}' and  infringes.status=0`
                );
                resolve(infringes);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCategories = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const categories = await query("select id , name from vehicle_categories");
                resolve(categories);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCarTypes = async (categoryId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const types = await query(
                    `select id , name from vehicle_types where vehicle_category_id=${categoryId}`
                );
                resolve(types);
            } catch (error) {
                reject(error);
            }
        });
    };

    checkCarExist = (license_plate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const car = await query(
                    `select count(*) as count from cars where license_plates = '${license_plate}' and delete_at is null`
                );
                if (car[0].count) {
                    reject(
                        new Error(
                            "Xe đã tồn tại.Vui lòng kiểm tra lại hoặc liên hệ để được hỗ trợ."
                        )
                    );
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    updateCar = async (req) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { carId } = req.query;
                const { license_plate, type, manufacture_at } = req.body;
                const car = await query(
                    `update cars set  license_plates= '${license_plate}' ,vehicle_type_id = ${type} , manufacture_at= ${manufacture_at} where cars.id = ${carId} `
                );
                return resolve(car);
            } catch (error) {
                reject(error);
            }
        });
    };

    addImagesForCar = (images, id) => {
        return new Promise(async (resolve, reject) => {
            connection.query(
                "insert into  car_images(car_id ,url) value  ?",
                [images.map((image) => [id, `images/${image.filename}`])],
                (error, results, fields) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve("success");
                }
            );
        });
    };

    deleteImagesForCar = (carId, idImages) => {
        return new Promise(async (resolve, reject) => {
            const condition = Array.isArray(idImages)
                ? idImages.reduce((str, imageId, index, list) => {
                      if (index === list.length - 1) {
                          return str + ` id = ${imageId}`;
                      }
                      return str + ` id = ${imageId} OR `;
                  }, "")
                : `id = ${idImages}`;
            try {
                await query(`delete from car_images where car_id = ${carId} and ${condition}`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    deleteCar = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `update cars set delete_at = CURRENT_TIMESTAMP where cars.id = ${carId}`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    addNewCar = (req) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { id } = req.user;
                const { license_plate, type, manufacture_at } = req.body;
                const car = await query(
                    `insert into cars(owner_id , license_plates ,vehicle_type_id , manufacture_at) VALUES (${id} , '${license_plate}' , ${type} , ${manufacture_at})`
                );
                return resolve(car);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCarInformation = (carId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const result =
                    await query(`SELECT cars.id ,cars.license_plates ,cars.manufacture_at , cars.vehicle_type_id as typeId,  vehicle_types.name as type ,vehicle_categories.name as category , vehicle_categories.id as categoryId FROM  cars 
                    INNER JOIN vehicle_types ON cars.vehicle_type_id = vehicle_types.id  AND cars.id = ${carId} AND cars.owner_id = ${userId}
                    INNER JOIN vehicle_categories on vehicle_categories.id =vehicle_types.vehicle_category_id;`);
                if (!result.length) return reject(new Error("Xe không tồn tại."));
                resolve(result[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCarImagesWithId = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const images = await query(
                    `SELECT id, url from car_images where car_images.car_id= ${carId}`
                );
                resolve(images);
            } catch (error) {
                reject(error);
            }
        });
    };

    getListImageDelete = (carId, idImages) => {
        return new Promise(async (resolve, reject) => {
            try {
                const condition = Array.isArray(idImages)
                    ? idImages.reduce((str, imageId, index, list) => {
                          if (index === list.length - 1) {
                              return str + ` id = ${imageId}`;
                          }
                          return str + ` id = ${imageId} OR `;
                      }, "")
                    : `id = ${idImages}`;
                const images = await query(
                    `SELECT id, url from car_images where car_images.car_id= ${carId} and ${condition}`
                );
                resolve(images);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCarWithId = (carId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const car = await query(`SELECT * FROM cars where cars.id =${carId} limit 1`);
                resolve(car[0]);
            } catch (error) {
                reject(error);
            }
        });
    };

    getCarWithLicensePlate = (licensePlate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const car = await query(
                    `SELECT * FROM cars where cars.license_plates= '${licensePlate}' and delete_at is null limit 1`
                );
                resolve(car[0]);
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    };
}

const carService = new CarService();
module.exports = carService;
