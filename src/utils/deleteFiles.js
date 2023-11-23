const fs = require("fs");

const deleteFiles = (files) => {
    files.map((file) => {
        const filePath = __basedir + "/src/public/images/" + file.filename;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
    return;
};

const deleteImages = (images) => {
    images.map((image) => {
        const path = __basedir + "/src/public/" + image.url;
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    });
};

module.exports = { deleteFiles, deleteImages };
