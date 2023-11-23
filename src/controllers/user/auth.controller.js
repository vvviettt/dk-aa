const { createToken } = require("../../services/jsonwebtoken.service");
const userService = require("../../services/user.service");
const response = require("../../utils/response");
const { updateUserSchema } = require("../../validations/auth.validation");
const uploadFileMiddleware = require("../../utils/saveImage");
const otpGenerator = require("otp-generator");
const otpService = require("../../services/otp.service");
require("dotenv/config");
const bcrypt = require("bcrypt");

const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, confirm_password } = req.value;
        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        // console.log("otp: ======", otp);
        await userService.checkEmailAndPhone({
            email: email,
            phone: phone,
        });
        await userService.checkConfirmPassword({
            confirm_password: confirm_password,
            password: password,
        });
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUND));
        await userService.createUser({
            name: name,
            email: email,
            phone: phone,
            password: hashedPassword,
            role_id: 1,
        });
        await otpService.OTP({
            otp: otp,
            phone: phone,
            expired: 60,
        });
        return res
            .status(200)
            .json(
                response({ info: "Đăng ký thành công !!!", phone: phone, otp: otp }, "Success", 1)
            );
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.value;

        const otpHolder = await otpService.findPhoneOTP({
            phone: phone,
        });
        // console.log("otpHolder: ", otpHolder);
        await otpService.validOTP({
            otp,
            hashOTP: otpHolder.otp,
        });
        await userService.updateVerify({ phone });
        return res.status(200).json(response({ info: "Verify thành công" }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
const getUserInfo = async (req, res) => {
    try {
        const user = await userService.getUserByID({ id: req.user.id, role: 1 });
        delete user.password;
        return res.status(200).json(response({ ...user }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
const updateUser = async (req, res) => {
    try {
        await uploadFileMiddleware(req, res);
        const { value, error } = updateUserSchema.validate(req.body);
        if (error) return res.status(200).json(response({}, error.message, 0));
        let filename = "";
        if (req.files.length) {
            filename = "images/" + req.files[0].filename;
        }
        if (value.removed) {
            filename = process.env.IMAGE_DEFAULT;
        }
        // console.log("value.email: ////", value.email);
        // console.log("IDDDDĐ: ////", req.user.id);

        // if (value.email != "undefined") {
        //     await userService.checkByEmail({ email: value.email, role: "1" });
        // }
        await userService.checkByEmail({ email: value.email, id: req.user.id });
        await userService.updateUserInfo(
            req.user.id,
            value.name || "",
            value.email || "",
            filename
        );
        const user = await userService.getUserByID({ id: req.user.id, role: "1" });
        return res.status(200).json(response({ user }, "Success", 1));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};
const login = async (req, res) => {
    try {
        console.log("Login");
        const user = await userService.getUserByPhone({ phone: req.value.phone_number, role: 1 });
        console.log("Login1");
        await userService.checkPassword(user.password, req.value.password);
        const token = createToken(
            process.env.SECRET_KEY,
            {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role_name,
            },
            "60days"
        );
        delete user.password;
        await userService.addDeviceToken(user.id, req.value.deviceToken);
        return res.status(200).json(response({ info: user, access_token: token }, "Success ", 1));
    } catch (error) {
        return res.status(500).json(response({}, error.message || "Lỗi máy chủ", 0));
    }
};

const logout = async (req, res) => {
    try {
        await userService.deleteToken(req.user.id, req.value.deviceToken);
        return res.status(200).json(response({}, "Đăng xuất thành công.", 0));
    } catch (error) {
        return res.status(200).json(response({}, error.message, 0));
    }
};

const refreshToken = async (req, res) => {};
module.exports = { register, login, logout, refreshToken, updateUser, getUserInfo, verifyOtp };
