const router = require('express').Router();
const { sendMessage } = require('../controller/messageController');
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class MessageAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.post('/', authMiddleware(Object.values(ROLES)), sendMessage);

        // router.get('/', authMiddleware(Object.values(ROLES)), fetchAllChats);

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/message';
    }
}

module.exports = MessageAPI;
