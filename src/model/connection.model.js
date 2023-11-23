const mysql = require("mysql2");
const databaseConfig = require("../config/db.config");

const connection = mysql.createPool({
    host: databaseConfig.host,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    multipleStatements: true,
    dateStrings: true,
    waitForConnections: true,
    queueLimit: 10,
});

module.exports = connection;
