const router = require('express').Router();
const { accessChat, fetchAllChats } = require('../controller/chatController');
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class ChatAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.get('/', authMiddleware(Object.values(ROLES)), fetchAllChats);
        router.post('/', authMiddleware(Object.values(ROLES)), accessChat);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/chat';
    }
}

module.exports = ChatAPI;
