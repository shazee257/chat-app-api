const { Router } = require('express');
const { register, login } = require('../controller/authController');

class AuthAPI {
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

module.exports = AuthAPI;
