const Joi = require("joi");

const costCalculationSchema = Joi.object({
    carId: Joi.number()
        .required()
        .min(0)
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "any.required":
                        error.message = "Mã xe là bắt buộc.";
                        break;
                    case "number.min":
                        error.message = "Mã xe không hợp lệ.";
                        break;
                    case "number.base":
                        error.message = "Mã xe không đúng định dạng";
                        break;
                }
            });
            return errors;
        }),
    address: Joi.string()
        .trim()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.base":
                        error.message = "Địa chỉ không hợp lệ";
                        break;
                }
            });
            return errors;
        }),
    distance: Joi.number()
        .min(0)
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Khoảng cách không hợp lệ.";
                        break;
                }
            });
            return errors;
        }),
});

const dateSchema = Joi.object({
    date: Joi.date()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "date.base":
                        error.message = "Ngày không hợp lệ.";
                        break;
                    case "any.required":
                        error.message = "Ngày là bắt buộc.";
                        break;
                }
            });
            return errors;
        }),
});

const registrationSchema = Joi.object({
    carId: Joi.number()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "number.base":
                        error.message = "Ngày không hợp lệ.";
                        break;
                    case "any.required":
                        error.message = "Mã xe là bắt buộc";
                        break;
                }
            });
            return errors;
        }),
    address: Joi.string()
        .trim()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.base":
                        error.message = "Địa chỉ không hợp lệ";
                        break;
                }
            });
            return errors;
        }),
    date: Joi.date()
        .min(Date.now())
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "date.base":
                        error.message = "Ngày đăng ký không hợp lệ.";
                        break;
                    case "date.min":
                        error.message = "Ngày đăng ký phải trong tương lai.";
                        break;
                    case "any.required":
                        error.message = "Ngày đăng ký là bắt buộc.";
                        break;
                }
            });
            return errors;
        }),

    registry_time: Joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/),

    tariff: Joi.number().default(0),
    license_fee: Joi.number().default(0),
    road_fee: Joi.number().default(0),
    serviceCost: Joi.number().default(0),
});

const idSchema = Joi.object({
    id: Joi.number().required(),
});

const competeSchema = Joi.object({
    id: Joi.number().required(),
    type: Joi.number().min(0).max(1).required(),
    plan_date: Joi.date()
        .min(Date.now())
        .when("type", { is: 1, then: Joi.required(), otherwise: Joi.optional() }),
    cost_plan_date: Joi.date().min(Date.now()),
});

const typeSchema = Joi.object({
    type: Joi.number().min(0).max(2).required(),
    limit: Joi.number().default(10),
    page: Joi.number().default(1),
    date: Joi.date().required(),
});
const payForRegisterSchema = Joi.object({
    id: Joi.number().required(),
    fee_5: Joi.number().default(0),
    fee_6: Joi.number().default(0),
    fee_7: Joi.number().default(0),
});

module.exports = {
    costCalculationSchema,
    registrationSchema,
    dateSchema,
    idSchema,
    typeSchema,
    competeSchema,
    payForRegisterSchema,
};
