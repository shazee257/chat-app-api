import { Router } from 'express';
import { register, login } from '../../controllers/index.js';
import { validate } from '../../validators/validate.js';
import { userRegisterValidator, userLoginValidator, emailExistsValidator } from '../../validators/index.js';

export default class AuthAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/register', [userRegisterValidator, validate, emailExistsValidator], register);
        this.router.post('/login', [userLoginValidator, validate], login);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}