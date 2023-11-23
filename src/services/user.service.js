// const httpStatus = require("http-status");
// const connection = require("../model/connection.model");
const query = require("../model/query.model");
const crypt = require("./crypt.service");
const bcrypt = require("bcrypt");
const OTPService = require("./otp.service");
class UserService {
    checkEmailAndPhone = async ({ email, phone }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT * FROM users WHERE email = '${email}' AND phone = '${phone}'`
                );
                if (user.length !== 0) {
                    reject(
                        new Error(
                            "Email hoặc Số điện thoại đã tồn tại. Vui lòng kiểm tra lại thông tin Đăng ký."
                        )
                    );
                }
                resolve(user[0]);
            } catch (error) {
                reject(error);
            }
        });
    };
    checkConfirmPassword = ({ confirmPassword, password }) => {
        return new Promise((resolve, reject) => {
            if (confirmPassword !== password) resolve();
            reject(new Error("Mật khẩu xác nhận chưa chính xác"));
        });
    };
    createUser = ({ name, email, phone, password, role_id }) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `INSERT INTO users(name, email, phone, password, role_id, username ) 
                    value ("${name}" , "${email}", "${phone}", "${password}", "${role_id}", "${name}");`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };
    createEmployee = ({
        name,
        email,
        phone,
        password,
        role_id,
        adress,
        user_id_sso,
        concurrency_stamp,
    }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const employee = await query(
                    `INSERT INTO users(name, role_id, email, username, phone, adress, status, password, user_id_sso, concurrency_stamp ) 
                    value ("${name}" , "${role_id}","${email}", "${name}","${phone}","${adress}","1", "${password}", "${user_id_sso}", "${concurrency_stamp}"  );`
                );
                resolve(employee);
            } catch (error) {
                reject(error);
            }
        });
    };
    assignmentEmployee = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let data = [];
                for (let i = 1; i <= 10; i++) {
                    data.push([i, id, 0, 0, 0, 1]);
                }
                await query(
                    `INSERT INTO user_function (function_id, user_id, create1, update1, delete1, read1) VALUES ?`,
                    [data]
                );
                resolve("Phân công thành công");
            } catch (error) {
                reject(error);
            }
        });
    };
    updateVerify = (phone) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(`UPDATE users SET isVerify = 1 WHERE phone = '${phone}'`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };
    updateUserInfo = (userId, name, email, avatar) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `UPDATE users 
                SET 
                    name = COALESCE(${name != "" ? `'${name}'` : null}, name), 
                    avatar = COALESCE(${avatar != "" ? `'${avatar}'` : null}, avatar),
                    email = COALESCE(${email != "" ? `'${email}'` : null}, email)
                WHERE id = ${userId};`
                );
                resolve(user);
            } catch (error) {
                reject(error);
            }
        });
    };

    getUserByPhone = ({ phone, role }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT users.* , roles.name as role_name FROM users  
                    inner join roles on users.role_id = roles.id and phone = '${phone}' and role_id ='${role}'`
                );
                if (user.length === 0) {
                    reject(new Error("Tài khoản không tồn tại."));
                }
                resolve(user[0]);
            } catch (err) {
                reject(err);
            }
        });
    };
    getUserByID = ({ id, role }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT * from users where id = '${id}' and role_id ='${role}'`
                );
                if (user.length === 0) {
                    reject(new Error("Tài khoản không tồn tại."));
                }
                resolve(user[0]);
            } catch (err) {
                reject(err);
            }
        });
    };
    checkByEmail = ({ email, id }) => {
        return new Promise(async (resolve, reject) => {
            try {
                // console.log("SSSSSSSSSSS", email, id);
                const checkEmailEmployee = await query(
                    `SELECT * from users where email = '${email}' and id ='${id}' `
                );
                // console.log("SSSSSSSSSSSSAAAAAa", checkEmailEmployee.length);
                if (checkEmailEmployee.length === 0) {
                    const user = await query(`SELECT * from users where email = '${email}' `);
                    if (user.length === 0) {
                        resolve("Email thay đổi không trung lặp với các email trong DB");
                    } else {
                        reject(new Error("Email thay đổi đã tồn tại"));
                    }
                } else {
                    resolve("Cập nhật thành công!!!");
                }
            } catch (err) {
                reject(err);
            }
        });
    };
    checkByPhoneEmployee = ({ phone, id }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const checkPhoneEmployee = await query(
                    `SELECT * from users where phone = '${phone}' and id ='${id}' `
                );
                if (checkPhoneEmployee.length === 0) {
                    const user = await query(`SELECT * from users where phone = '${phone}' `);
                    if (user.length === 0) {
                        resolve("Phone thay đổi không trung lặp với các phone trong DB");
                    } else {
                        return reject(new Error("Phone thay đổi đã tồn tại"));
                    }
                } else {
                    resolve("Cập nhật thành công!!!");
                }
            } catch (err) {
                reject(err);
            }
        });
    };

    getByEmail = ({ email, role }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT * from users where email = '${email}' and role_id ='${role}'`
                );
                if (user.length === 0) {
                    resolve(null);
                }
                reject(new Error("Email này đã tồn tại."));
            } catch (err) {
                reject(err);
            }
        });
    };
    getUserByUsername = ({ username, role }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT users.*, roles.name as role_name FROM users 
                    inner join roles on users.role_id = roles.id and users.username = '${username}' and role_id ='${role}'`
                );
                // if (user.length === 0) {
                //     return reject(new Error("Tài khoản không tồn tại."))
                // }
                resolve(user[0]);
            } catch (err) {
                reject(err);
            }
        });
    };
    getEmployeeByUsername = ({ username }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT users.*, roles.name as role_name FROM users 
                    inner join roles on users.role_id = roles.id and users.username = '${username}' and role_id ='3'`
                );
                // console.log(user);
                if (user.length === 0) {
                    resolve(null);
                }
                resolve(user[0]);
            } catch (err) {
                reject(err);
            }
        });
    };

    checkPassword = (hashPassword, password) => {
        return new Promise((resolve, reject) => {
            const decode = crypt.decode(hashPassword, password);
            if (decode) resolve();
            reject(new Error("Mật khẩu hoặc điện thoại không đúng."));
        });
    };

    saveRefreshToken = (token, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `INSERT INTO refresh_tokens(user_id , token) value ("${userId}" , "${token}");`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    checkRefreshToken = (token, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const count = await query(
                    `SELECT count(*) as count from refresh_tokens where user_id = ${userId} and token = '${token}';`
                );
                if (count[0].count) {
                    resolve();
                }
                reject(new Error("Tài khoản  bị đăng nhập nơi khác."));
            } catch (error) {
                reject(error);
            }
        });
    };

    addDeviceToken = async (userId, deviceToken) => {
        return new Promise(async (resolve, reject) => {
            try {
                const token = await query(
                    `SELECT count(*) as count from device_tokens where user_id = ${userId} and token =  '${deviceToken}'`
                );
                if (token[0].count === 0) {
                    await query(
                        `INSERT INTO device_tokens (user_id , token) VALUES (${userId}, '${deviceToken}') `
                    );
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    deleteToken = (userId, deviceToken) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query(
                    `DELETE from device_tokens where user_id = ${userId} and token ='${deviceToken}' `
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    checkRefreshToken = async (token) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `SELECT users.* FROM refresh_tokens INNER JOIN users on users.id = refresh_tokens.user_id AND refresh_tokens.token = '${token}';`
                );
                if (!user.length) reject(new Error("Token is invalid"));
                resolve(user[0]);
            } catch (error) {
                reject(error);
            }
        });
    };
    deleteRefreshToken = (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                await query("DELETE FROM refresh_tokens where refresh_tokens.user_id = ?", [id]);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    changePassword = (password, id, concurrency_stamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const hash = bcrypt.hashSync(password, 10);
                await query(
                    `UPDATE users SET password = '${hash}',concurrency_stamp = '${concurrency_stamp}' WHERE id = ${id}`
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    updateEmployeeInfo = async (userId, phone, email, avatar, concurrency_stamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await query(
                    `UPDATE users 
                SET 
                    phone = COALESCE(${phone != "" ? `'${phone}'` : null}, phone), 
                    avatar = COALESCE(${avatar != "" ? `'${avatar}'` : null}, avatar),
                    email = COALESCE(${email != "" ? `'${email}'` : null}, email),
                    concurrency_stamp = '${concurrency_stamp}'
                WHERE id = ${userId};`
                );
                resolve(user);
            } catch (error) {
                reject(error);
            }
        });
    };
}

const userService = new UserService();
module.exports = userService;
