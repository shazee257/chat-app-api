import { Router } from 'express';
import { register, login } from '../../controllers/index.js';

export default class AuthAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/register', register);
        this.router.post('/login', login);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}