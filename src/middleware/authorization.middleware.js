const httpStatus = require("http-status");
const { checkRegisteredForCar } = require("../controllers/user/car.controller");
const query = require("../model/query.model");
const { verifyToken } = require("../services/jsonwebtoken.service");
const ApiError = require("../utils/ApiError");
const response = require("../utils/response");

const checkUser = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(httpStatus.UNAUTHORIZED).json(response({}, "Không có quyền truy cập", 0));
    }
    const token = authorization.split(" ")[1];
    const verify = verifyToken(process.env.SECRET_KEY, token);
    if (verify.err) {
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json(response({ type: "EXPIRED" }, "Không có quyền truy cập", 0));
    }
    req.user = verify.user;
    next();
};

const checkCarWithId = async (req, res, next) => {
    const carId = req.query.carId || req.body.carId || req.params.carId;
    const { id } = req.user;
    try {
        const car = await query(
            `SELECT * FROM cars WHERE cars.id = ${carId} and cars.owner_id = ${id} and cars.delete_at is null;`
        );
        console.log(car);
        if (!car.length) {
            return res.status(400).json(response({}, "Không có quyền truy cập", 0));
        }
        req.car = car[0];
        next();
    } catch (error) {
        return res.status(400).json(response({}, error.message, 0));
    }
};

const checkCarWithLicensePlate = async (req, res, next) => {
    const licensePlate = req.query.licensePlate || req.body.licensePlate || req.params.licensePlate;
    const { id } = req.user;
    try {
        const car = await query(
            `SELECT * FROM cars WHERE cars.license_plates = '${licensePlate}' and cars.owner_id = ${id} and cars.delete_at is null;`
        );
        if (!car.length) {
            return res.status(400).json(response({}, "Không có quyền truy cập", 0));
        }
        req.car = car[0];
        next();
    } catch (error) {
        return res.status(400).json(response({}, error.message, 0));
    }
};

const checkRegistry = async (req, res, next) => {
    const registryId = req.query.registryId || req.body.registryId || req.params.registryId;
    const { id } = req.user;
    try {
        const registry = await query(
            `SELECT * FROM registry_managements WHERE registry_managements.id = ${registryId} and registry_managements.owner_id = ${id} and registry_managements.delete_at is null;`
        );
        if (!registry.length) {
            return res.status(400).json(response({}, "Không có quyền truy cập", 0));
        }
        req.registry = registry[0];
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json(response({}, error.message, 0));
    }
};
const checkRoleView = async (req, res, next) => {
    const type = req.value.type;
    const userId = req.user.id;
    try {
        const functions = await query(
            `SELECT username, user_id, function_id, create1, update1, delete1, read1
            from registration.user_function 
            INNER JOIN registration.users 
            ON user_function.user_id = users.id 
            WHERE user_id = '${userId}'`
        );
        req.functions = { ...functions };
        if (!(req.functions[`${type}`].read1 === 1)) {
            return res.status(400).json(response({}, "Nhân viên không có quyền truy cập", 0));
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json(response({}, error.message, 0));
    }
};
const checkRoleEditPay = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const functions = await query(
            `SELECT username, user_id, function_id, create1, update1, delete1, read1
            from registration.user_function 
            INNER JOIN registration.users 
            ON user_function.user_id = users.id 
            WHERE user_id = '${userId}'`
        );

        const userFunction = { ...functions };
        if (!(userFunction["1"].update1 === 1)) {
            return res.status(400).json(response({}, "Nhân viên không có quyền truy cập", 0));
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json(response({}, error.message, 0));
    }
};
const checkRoleEditComplete = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const functions = await query(
            `SELECT username, user_id, function_id, create1, update1, delete1, read1
            from registration.user_function 
            INNER JOIN registration.users 
            ON user_function.user_id = users.id 
            WHERE user_id = '${userId}'`
        );

        const userFunction = { ...functions };

        if (!(userFunction["2"].update1 === 1)) {
            return res.status(400).json(response({}, "Nhân viên không có quyền truy cập", 0));
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json(response({}, error.message, 0));
    }
};

const checkEmployee = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(httpStatus.UNAUTHORIZED).json(response({}, "Không có quyền truy cập", 0));
    }
    const token = authorization.split(" ")[1];
    const verify = verifyToken(process.env.EMPLOYEE_SECRET_KEY, token);
    if (verify.err) {
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json(response({ type: "EXPIRED" }, "Không có quyền truy cập", 0));
    }
    req.user = verify.user;
    next();
};

module.exports = {
    checkUser,
    checkEmployee,
    checkCarWithId,
    checkRegistry,
    checkRoleView,
    checkRoleEditPay,
    checkRoleEditComplete,
    checkCarWithLicensePlate,
};
