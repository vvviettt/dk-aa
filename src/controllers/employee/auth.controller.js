const { createToken } = require("../../services/jsonwebtoken.service");
const userService = require("../../services/user.service");
const response = require("../../utils/response");
const uploadFileMiddleware = require("../../utils/saveImage");
const { updateEmployeeSchema } = require("../../validations/auth.validation");
const bcrypt = require("bcrypt");
const SSO = require("../../config/tokenSSO");
const apiSSO = require("../../utils/apiSSO");
class AuthController {
    login = async (req, res, next) => {
        try {
            const user = await userService.getEmployeeByUsername({
                username: req.value.username,
            });
            if (user == null) {
                const { username, password } = req.value;
                const tokenSSO = await SSO.getToken();
                const listUser = await apiSSO.getAllData(tokenSSO.access_token);
                const itemsUser = listUser.items.find((x) => x.userName === `${username}`);
                const login_result = await apiSSO.loginUser(username, password);
                const hashedPassword = await bcrypt.hash(
                    password,
                    parseInt(process.env.BCRYPT_SALT_ROUND)
                );
                await userService.getByEmail({ email: itemsUser.email, role: 3 });
                if (listUser.items.findIndex((x) => x.userName === `${username}`) !== -1) {
                    // console.log("RESULT: ", login_result.result);
                    if (login_result.result === 1) {
                        const newEmployee = await userService.createEmployee({
                            name: itemsUser.userName,
                            email: itemsUser.email,
                            phone: itemsUser.phoneNumber ? itemsUser.phoneNumber : "",
                            password: hashedPassword,
                            role_id: 3,
                            adress: "Đà Nẵng",
                            user_id_sso: itemsUser.id,
                            concurrency_stamp: itemsUser.concurrencyStamp,
                        });
                        console.log("newEmployee: ", newEmployee);
                        await userService.assignmentEmployee(newEmployee.insertId);
                    } else {
                        return res.status(200).json(response({}, "Đăng nhập không thành công", 0));
                    }
                } else {
                    return res.status(200).json(response({}, "Đăng nhập không thành công", 0));
                }
            }
            req.employeeId = user.id;
            // console.log(" req.employeeId: ", req.employeeId);
            await userService.deleteRefreshToken(user.id);
            await userService.checkPassword(user.password, req.value.password);
            const token = createToken(
                process.env.EMPLOYEE_SECRET_KEY,
                {
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                    id: user.id,
                },
                "60d"
            );

            delete user.password;
            if (req.value.deviceToken) {
                await userService.addDeviceToken(user.id, req.value.deviceToken);
            }
            return res
                .status(200)
                .json(response({ info: { ...user }, access_token: token }, "Successfully", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
    refreshToken = async (req, res) => {
        try {
            const { token } = req.value;
            const user = await userService.checkRefreshToken(token);
            const access_token = createToken(
                process.env.EMPLOYEE_SECRET_KEY,
                {
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                    id: user.id,
                },
                "30m"
            );
            return res.status(200).json(response({ access_token }, "Success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };

    changePassword = async (req, res) => {
        const { oldPassword, newPassword, confirmPassword } = req.value;
        const { id, phone } = req.user;
        try {
            if (newPassword !== confirmPassword) {
                return res.status(200).json(response({}, "Mật khẩu không hợp lệ.", 0));
            }
            // console.log(phone);
            const user = await userService.getUserByPhone({ phone, role: 3 });
            await userService.checkPassword(user.password, oldPassword);
            const tokenSSO = await SSO.getToken();
            const SSOUser = await apiSSO.accountDetail(token.access_token, id);
            await apiSSO.updateWithPasswordUser(
                tokenSSO.access_token,
                id,
                SSOUser.userName,
                newPassword,
                SSOUser.concurrencyStamp
            );
            await userService.changePassword(newPassword, id, SSOUser.concurrencyStamp);
            return res.status(200).json(response({}, "Thay đổi mật khẩu thành công.", 1));
        } catch (error) {
            console.log(error);
            return res.status(200).json(response({}, "Thay đổi mật khẩu thất bại", 0));
        }
    };
    getUserInfo = async (req, res) => {
        try {
            const user = await userService.getUserByID({ id: req.user.id, role: 3 });
            delete user.password;
            return res.status(200).json(response({ ...user }, "Success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
    updateEmployee = async (req, res) => {
        try {
            await uploadFileMiddleware(req, res);
            const { value, error } = updateEmployeeSchema.validate(req.body);
            if (error) return res.status(200).json(response({}, error.message, 0));
            let filename = "";
            if (req.files.length) {
                filename = "images/" + req.files[0].filename;
            }
            if (value.removed) {
                filename = process.env.IMAGE_DEFAULT;
            }
            // console.log(value);
            const token = await SSO.getToken();
            const infoUser = await userService.getUserByID({ id: req.user.id, role: 3 });
            const SSOUser = await apiSSO.accountDetail(token.access_token, infoUser.user_id_sso);
            await apiSSO.updateUser(
                token.access_token,
                infoUser.user_id_sso,
                SSOUser.userName,
                value.phone,
                value.email,
                SSOUser.concurrencyStamp
            );
            await userService.checkByEmail({ email: value.email, id: req.user.id });
            await userService.checkByPhoneEmployee({
                phone: value.phone,

                id: req.user.id,
            });
            await userService.updateEmployeeInfo(
                req.user.id,
                value.phone || "",
                value.email || "",
                filename,
                SSOUser.concurrencyStamp
            );
            const user = await userService.getUserByID({ id: req.user.id, role: "3" });
            return res.status(200).json(response({ avatar: user.avatar }, "Success", 1));
        } catch (error) {
            return res.status(200).json(response({}, error.message, 0));
        }
    };
}

const authController = new AuthController();
module.exports = authController;
