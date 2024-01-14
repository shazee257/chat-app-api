import { body } from "express-validator";
import { findUser } from "../../models/index.js";

export const userRegisterValidator = [
    body("email").trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Email is invalid"),
    body("name").trim()
        .notEmpty().withMessage("name is required")
        .isLength({ min: 3 }).withMessage("name must be at lease 3 characters long"),
    body("password").trim()
        .notEmpty().withMessage("Password is required"),
];

export const emailExistsValidator = (req, res, next) => {
    body('email').custom(async (value) => {
        const user = await findUser({ email: value });
        if (user) return next({
            statusCode: 409,
            message: "Email already exists!"
        });

        next();
    }).run(req);
}



export const userLoginValidator = [
    body("email").trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Email is invalid"),
    body("password").trim()
        .notEmpty().withMessage("Password is required"),
];