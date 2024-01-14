import { generateResponse, parseBody } from '../utils/helper.js';
import { getAllUsers } from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// get all users
export const fetchAllUsers = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    try {
        const usersData = await getAllUsers({ page, limit });
        if (usersData?.users?.length === 0) {
            generateResponse(null, 'No users found', res);
            return;
        }

        generateResponse(usersData, 'Users found', res);
    } catch (error) {
        next(error);
    }
});
