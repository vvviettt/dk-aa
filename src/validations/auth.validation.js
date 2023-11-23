const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string()
        .trim()
        .required()
        .pattern(/^(\+84|84|0){1}([3|5|7|8|9]){1}([0-9]{8})$/),
    email: Joi.string().email().trim().required(),
    password: Joi.string().trim().min(8).required(),
    confirm_password: Joi.string().trim().min(8).required(),
});
const verifySchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^(\+84|84|0){1}([3|5|7|8|9]){1}([0-9]{8})$/),
    otp: Joi.number(),
});

const updateUserSchema = Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email().trim(),
    removed: Joi.number(),
});

const updateEmployeeSchema = Joi.object({
    phone: Joi.string().trim(),
    email: Joi.string().email().trim(),
    removed: Joi.number(),
});

const loginSchema = Joi.object({
    phone_number: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
    deviceToken: Joi.string().trim(),
});

const employeeLoginSchema = Joi.object({
    username: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
    deviceToken: Joi.string().trim(),
});

const logoutSchema = Joi.object({
    deviceToken: Joi.string().trim(),
});

const token = Joi.object({
    token: Joi.string().trim().required(),
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .trim()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.required":
                        error.message = "Vui lòng nhập mật khẩu cũ.";
                        break;
                }
            });
            return errors;
        }),
    newPassword: Joi.string()
        .trim()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.required":
                        error.message = "Vui lòng nhập mật khẩu mới.";
                        break;
                    case "string.pattern.base":
                        error.message =
                            "Mật khảu phải có 1 chư cái thường , 1 chữ in hoa ,1 chữ sô , 1 kí tự đặc biệt và có dài ít nhất 8 kí tự. ";
                }
            });
            return errors;
        }),
    confirmPassword: Joi.string()
        .trim()
        .required()
        .error((errors) => {
            errors.map((error) => {
                switch (error.code) {
                    case "string.required":
                        error.message = "Vui lòng xác nhận lại mật khẩu.";
                        break;
                }
            });
            return errors;
        }),
});
module.exports = {
    registerSchema,
    loginSchema,
    logoutSchema,
    token,
    verifySchema,
    updateUserSchema,
    changePasswordSchema,
    employeeLoginSchema,
    updateEmployeeSchema,
};
