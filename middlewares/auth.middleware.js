import jwt from 'jsonwebtoken';
import { STATUS_CODES } from '../utils/constants.js';

export const authMiddleware = (roles) => {
    return (req, res, next) => {
        const accessToken = req.header('accessToken') || req.session.accessToken;
        if (!accessToken) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Authorization failed!'
        });

        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) return next({
                statusCode: STATUS_CODES.UNAUTHORIZED,
                message: 'token expired'
            });

            req.user = { ...decoded };

            if (!roles.includes(req.user.role)) return next({
                statusCode: STATUS_CODES.UNAUTHORIZED,
                message: 'Unauthorized access!'
            });

            // next middleware is called
            next();
        });
    }
}