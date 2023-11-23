const response = (data, message, status) => {
    return { status: status, data: data, message: message };
};

module.exports = response;
