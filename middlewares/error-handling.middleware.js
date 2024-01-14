import { Error as MongooseError } from "mongoose";

export function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode ? err.statusCode : err instanceof MongooseError ? 400 : 500;
    const error = new ApiError(statusCode, err?.message?.replace(/\"/g, '') || 'Internal Server Error', err?.errors, err?.stack);

    return res.status(statusCode).json({
        message: error?.message,
        errors: error?.errors || [],
        statusCode: error?.statusCode,
        stack: error?.stack,
    });
}


