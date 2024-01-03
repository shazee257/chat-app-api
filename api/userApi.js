const { fetchAllUsers } = require('../controller/userController');
const router = require('express').Router();
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class UserAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.get('/', authMiddleware(Object.values(ROLES)), fetchAllUsers);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI;
