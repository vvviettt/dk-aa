const util = require("util");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + "/public/images/");
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4());
    },
});

let uploadFile = multer({
    storage: storage,
    limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
