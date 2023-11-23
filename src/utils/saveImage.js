const multer = require("multer");
const util = require("util");
const { v4: uuidv4 } = require("uuid");
const maxSize = 10 * 1024 * 1024;

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + "/src/public/images");
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + "-" + Date.now() + "." + file.mimetype.split("/")[1]);
    },
});

let uploadFile = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error("Chỉ nhận định dạng .jpg , .jpeg hoặc .png"));
        }
    },
    limits: { fileSize: maxSize },
}).array("photos", 20);

let uploadFileMiddleware = util.promisify(uploadFile);

module.exports = uploadFileMiddleware;
