const axios = require("axios");
require("dotenv").config();
const qs = require("qs");

const body = qs.stringify({
    username: "admin",
    password: "1q2w3E*",
    grant_type: "password",
});
const token = process.env.SSO_TOKEN;
const encodedToken = Buffer.from(token).toString("base64");
var config = {
    method: "post",
    url: "https://sso.greenglobal.com.vn/connect/token",
    headers: {
        Authorization: "Basic " + encodedToken,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: ".AspNetCore.Antiforgery.9TtSrW0hzOs=CfDJ8OTaevluuStNsR-X2DQBBG-A3TvpL2ePJs5hgGh-AIncurxJbEBjE7zuiyd8NrQefWnXkup8EIuTLDNOT2-7MhMKcPgozf8eKtD9cklRnHIROKA8RbYSmjzEXB8fTM8JNyzqVTG6lkJfeEHBFcqHy74",
    },
    data: body,
};

async function getToken() {
    let response;
    try {
        response = await axios(config);
    } catch (e) {
        throw new Error(e.message);
    }
    return response?.data ? response?.data : null;
}

module.exports = { getToken };
