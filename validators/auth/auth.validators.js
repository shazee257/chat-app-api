import { body } from "express-validator";

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

export const userLoginValidator = [
    body("email").trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Email is invalid"),
    body("password").trim()
        .notEmpty().withMessage("Password is required"),
];