// const { generateResponse, parseBody, generateAccessToken } = require('../utils');

// const { createUser, findUser } = require('../models/userModel');
// const asyncHandler = require("express-async-handler");
// const { compare, hash } = require('bcrypt');
// const { STATUS_CODES } = require('../utils/constants');

import { generateResponse, parseBody, generateAccessToken } from '../utils/helper.js';
import { createUser, findUser } from '../models/userModel.js';
import asyncHandler from 'express-async-handler';
import { compare, hash } from 'bcrypt';
import { STATUS_CODES } from '../utils/constants.js';

// register user
export const register = asyncHandler(async (req, res, next) => {
    const body = parseBody(req.body);

    try {
        const userExist = await findUser({ email: body?.email });
        // user already exist then return error
        if (userExist) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Email already exists'
        });

        // hash password
        const hashedPassword = await hash(body.password, 10);
        body.password = hashedPassword;

        // create user in db
        const user = await createUser(body);
        generateResponse(user, 'Register successful', res);
    } catch (error) {
        next(error);
    }
});

// login user
export const login = asyncHandler(async (req, res, next) => {
    const body = parseBody(req.body);

    try {
        const user = await findUser({ email: body?.email }).select('+password');
        if (!user) return next({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: 'Invalid email or password'
        });

        const isMatch = await compare(body.password, user.password);
        if (!isMatch) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Invalid password'
        });

        const accessToken = generateAccessToken(user);
        req.session.accessToken = accessToken;

        generateResponse({ user, accessToken }, 'Login successful', res);
    } catch (error) {
        next(error);
    }
});