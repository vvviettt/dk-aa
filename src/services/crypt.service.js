const bcrypt = require("bcrypt");

const decode = (code, data) => {
    const hash = bcrypt.compareSync(data, code);
    return hash;
};

module.exports = { decode };
