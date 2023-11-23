const httpStatus = require("http-status");
const fs = require("fs");
const response = require("../../utils/response");
const carService = require("../../services/car.service");
const uploadFile = require("../../utils/saveImage");
const { deleteFiles, deleteImages } = require("../../utils/deleteFiles");
const { newCarSchema, deleteCarSchema } = require("../../validations/car.validate");

const getCarsForUser = async (req, res) => {
    try {
        const user = req.user;
        const cars = await carService.getCarsForUser(user.id);
        return res
            .status(200)
            .json(response({ rows: cars, recordsTotal: cars.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};
const createNewCar = async (req, res) => {
    try {
        await uploadFile(req, res);
        const { value, error } = newCarSchema.validate(req.body);
        if (error) return res.status(200).json(response({}, error.message, 0));
        req.body.license_plate = req.body.license_plate.trim();
        await carService.checkCarExist(req.body.license_plate);
        const { insertId } = await carService.addNewCar(req, res);
        if (req.files.length) {
            await carService.addImagesForCar(req.files, insertId);
        }
        return res.status(200).json(response({}, "Thêm xe thành công.", 1));
    } catch (error) {
        deleteFiles(req.files);
        return res.status(200).json(response({}, error.message || "Lỗi máy chủ.", 0));
    }
};

const updateCar = async (req, res) => {
    try {
        await uploadFile(req, res);
        const imageDelete = req.body.delete;
        const { value, error } = deleteCarSchema.validate(req.body);
        if (error) return res.status(200).json(response({}, error.message, 0));
        req.body.license_plate = req.body.license_plate.trim();
        await carService.checkRegistryWithId(req.car.id);
        await carService.updateCar(req);
        if (imageDelete && imageDelete.length) {
            const images = await carService.getListImageDelete(req.car.id, imageDelete);
            deleteImages(images);
            await carService.deleteImagesForCar(req.car.id, imageDelete);
        }
        if (req.files.length) {
            await carService.addImagesForCar(req.files, req.car.id);
        }
        res.status(200).json(response({}, "Cập nhật thành công", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const deleteCar = async (req, res) => {
    try {
        await carService.deleteCar(req.value.carId);
        return res.status(200).json(response({}, "Xóa thành công", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const checkRegisteredForCar = async (req, res) => {
    try {
        const { carId } = req.params;
        await carService.getRegistryNoCompleted(carId);
        return res.status(200).json(response({ isValid: true }, "Success", 1));
    } catch (error) {
        return res
            .status(200)
            .json(response({ isValid: false }, error.message || "Lỗi máy chủ", 0));
    }
};

const checkErrorById = async (req, res) => {
    try {
        const { carId } = req.params;
        const result = await carService.checkErrorWithId(carId);
        if (!result.status) {
            return res.status(200).json(response({ isValid: false }, "Xe có lỗi vi phạm", 1));
        }
        return res.status(200).json(response({ isValid: true }, "Success", 1));
    } catch (error) {
        return res
            .status(200)
            .json(response({ isValid: false }, error.message || "Lỗi máy chủ", 0));
    }
};

const getErrorById = async (req, res) => {
    try {
        const { carId } = req.params;
        const errors = await carService.getAllErrorById(carId);
        return res
            .status(200)
            .json(response({ rows: errors, recordsTotal: errors.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const getErrorByLicensePlate = async (req, res) => {
    try {
        const { licensePlate } = req.value;
        const infringes = await carService.getAllErrorByLicensePlate(licensePlate);
        return res
            .status(200)
            .json(response({ rows: infringes, recordsTotal: infringes.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await carService.getCategories();
        return res
            .status(200)
            .json(response({ rows: categories, recordsTotal: categories.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const getCarType = async (req, res, next) => {
    try {
        const types = await carService.getCarTypes(req.value.categoryId);
        return res
            .status(200)
            .json(response({ rows: types, recordsTotal: types.length }, "Success", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const getCarInformationWithId = async (req, res) => {
    try {
        const info = await carService.getCarInformation(req.value.carId, req.user.id);
        const images = await carService.getCarImagesWithId(req.value.carId);
        return res.status(200).json(
            response(
                {
                    id: info.id,
                    license_plate: info.license_plates,
                    manufacture_at: info.manufacture_at,
                    type: { id: info.typeId, name: info.type },
                    category: { id: info.categoryId, name: info.category },
                    display_images: images,
                },
                "Success",
                1
            )
        );
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi không xác định", 0));
    }
};

module.exports = {
    getCarsForUser,
    createNewCar,
    checkRegisteredForCar,
    checkErrorById,
    getErrorById,
    getCategories,
    getCarType,
    getErrorByLicensePlate,
    getCarInformationWithId,
    updateCar,
    deleteCar,
};
