const { Schema, model, Error: MongooseError } = require("mongoose");
const { removeUnusedMulterImageFilesOnError } = require("../utils");

// log schema
const logSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    body: { type: String },
    statusCode: { type: Number },
    endPoint: { type: String },
    message: String,
    stack: String,
});

const LogModel = model('Log', logSchema);

class ErrorHandling {
    static notFound(req, res, next) {
        const error = new Error(`Not Found - ${req.originalUrl}`);
        res.status(404);
        next(error);
    }

    static errorHandler(err, req, res, next) {
        const statusCode = err.statusCode ? err.statusCode : err instanceof MongooseError ? 400 : 500;
        const error = new Error(err?.message.replace(/\"/g, '') || 'Internal Server Error');

        const log = new LogModel({
            body: JSON.stringify(req.body),
            statusCode,
            endPoint: req?.originalUrl,
            message: error?.message,
            stack: error?.stack,
        });

        // save the log document
        try {
            removeUnusedMulterImageFilesOnError(req);
            log.save();
        } catch (error) {
            console.log("Error from errorHandling >> ", error);
        }

        return res.status(statusCode).json({
            message: error?.message,
            statusCode: statusCode,
            stack: error?.stack,
        });
    }
}

module.exports = ErrorHandling;