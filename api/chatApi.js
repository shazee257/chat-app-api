const router = require('express').Router();
const { accessChat } = require('../controller/chatController');
const auth = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class ChatAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.post('/', auth(Object.values(ROLES)), accessChat);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/chat';
    }
}

module.exports = ChatAPI;
