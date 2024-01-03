const { generateResponse, parseBody } = require('../utils');
const { getAllUsers } = require('../models/userModel');
const { STATUS_CODES } = require('../utils/constants');
const asyncHandler = require("express-async-handler");

// get all users
const fetchAllUsers = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    try {
        const usersData = await getAllUsers({ page, limit });
        if (usersData?.users.length === 0) {
            generateResponse(null, 'No users found', res);
            return;
        }

        generateResponse(usersData, 'Users found', res);
    } catch (error) {
        next(error);
    }
});

module.exports = {
    fetchAllUsers
}