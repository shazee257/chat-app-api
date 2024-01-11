const { fetchAllUsers } = require('../controller/userController');
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class UserAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', authMiddleware(Object.values(ROLES)), fetchAllUsers);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI;
