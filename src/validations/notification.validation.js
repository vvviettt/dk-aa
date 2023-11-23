const Joi = require("joi");

const notificationFromExcel = Joi.object({
    licensePlate: Joi.array().items(Joi.string().trim().required()).required(),
});

module.exports = { notificationFromExcel };
