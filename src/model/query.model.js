const connection = require("./connection.model");

const query = (sql, data) => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) return reject(err);
            conn.query(sql, data || null, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
            connection.releaseConnection(conn);
        });
    });
};

module.exports = query;
