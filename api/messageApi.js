const router = require('express').Router();
const { sendMessage, fetchAllMessages } = require('../controller/messageController');
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class MessageAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.get('/:chatId', authMiddleware(Object.values(ROLES)), fetchAllMessages);

        router.post('/', authMiddleware(Object.values(ROLES)), sendMessage);


    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/message';
    }
}

module.exports = MessageAPI;
