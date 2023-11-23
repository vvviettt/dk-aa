const Joi = require("joi");

const carSchema = Joi.object({
    carId: Joi.number()
        .min(1)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Mã xe không đúng.";
                        break;
                    case "any.required":
                        error.message = "Mã xe bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
});

const licensePlateSchema = Joi.object({
    licensePlate: Joi.string()
        .trim()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.base":
                        error.message = "Biển số không đúng.";
                        break;
                    case "any.required":
                        console.log("rt");
                        error.message = "Biển số  bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
});

const typeSchema = Joi.object({
    categoryId: Joi.number()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Chủng loại không đúng.";
                        break;
                    case "any.required":
                        error.message = "Chủng loại bắt buộc.";
                        break;
                }
            });
        }),
});

const newCarSchema = Joi.object({
    license_plate: Joi.string()
        .trim()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.base":
                        error.message = "Biển số không đúng.";
                        break;
                    case "any.required":
                        error.message = "Biển số  bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
    type: Joi.number()
        .min(1)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Loại xe không hợp lệ.";
                        break;
                    case "number.min":
                        error.message = "Loại xe không hợp lệ.";
                        break;
                    case "any.required":
                        error.message = "Loại xe bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
    manufacture_at: Joi.number()
        .min(1990)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Năm sản xuất không hợp lệ.";
                        break;
                    case "number.min":
                        error.message = "Năm sản xuất không đúng";
                        break;
                    case "any.required":
                        error.message = "Năm sản xuất bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
});

const deleteCarSchema = Joi.object({
    license_plate: Joi.string()
        .trim()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.base":
                        error.message = "Biển số không đúng.";
                        break;
                    case "any.required":
                        error.message = "Biển số  bắt buộc.";
                        break;
                }
            });
        }),
    type: Joi.number()
        .min(1)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Loại xe không hợp lệ.";
                        break;
                    case "number.min":
                        error.message = "Loại xe không hợp lệ.";
                        break;
                    case "any.required":
                        error.message = "Loại xe bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
    manufacture_at: Joi.number()
        .min(1990)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Năm sản xuất không hợp lệ.";
                        break;
                    case "number.min":
                        error.message = "Năm sản xuất không đúng";
                        break;
                    case "any.required":
                        error.message = "Năm sản xuất bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
    delete: Joi.array(),
});
module.exports = { carSchema, typeSchema, newCarSchema, deleteCarSchema, licensePlateSchema };
