const { fetchAllUsers } = require('../controller/userController');
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class UserAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.get('/', auth(Object.values(ROLES)), fetchAllUsers);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI;
