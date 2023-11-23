const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const validator = (schema, data) => (req, res, next) => {
    const { value, error } = schema.validate(req[data]);

    if (error) {
        const message = error.details.map((detail) => detail.message).join(",");
        return next(new ApiError(httpStatus.BAD_REQUEST, message));
    }
    req.value = value;
    return next();
};

module.exports = validator;
