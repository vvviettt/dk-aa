const connection = require("../model/connection.model");
const query = require("../model/query.model");
const crypt = require("./crypt.service");
const bcrypt = require("bcrypt");

class OTPService {
    OTP = async ({ otp, phone, expired }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const salt = await bcrypt.genSalt(10);
                const hashOTP = await bcrypt.hash(otp, salt);
                const OTP = await query(
                    `INSERT INTO otps( phone, otp ,  expired) value ("${phone}", "${hashOTP}" , "${expired}");`
                );
                resolve(OTP ? 1 : 0);
            } catch (error) {
                reject(error);
            }
        });
    };
    findPhoneOTP = async ({ phone }) => {
        return new Promise(async (resolve, reject) => {
            try {
                const OTP = await query(`SELECT * FROM otps WHERE phone = ${phone}`);
                if (OTP.length === 0) {
                    reject(new Error("Không tồn tại mã OPT cho số điện thoại này."));
                }
                const lastOTP = OTP.length - 1;
                console.log("OTP=====", OTP[lastOTP]);
                resolve(OTP[lastOTP]);
            } catch (error) {
                reject(error);
            }
        });
    };
    validOTP = async ({ otp, hashOTP }) => {
        console.log("otp, hashOTP: ======", otp, hashOTP);
        return new Promise(async (resolve, reject) => {
            try {
                const isValid = await bcrypt.compare(`${otp}`, hashOTP);
                // const isValid = await query(`SELETE * FROM otps WHERE otp = ${otp}`);
                if (isValid == false) {
                    reject(new Error("OPT không hợp lệ."));
                }
                resolve(isValid);
            } catch (error) {
                reject(error);
            }
        });
    };
}
const otpService = new OTPService();
module.exports = otpService;
