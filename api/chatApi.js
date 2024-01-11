const { Router } = require('express');
const {
    accessChat,
    fetchAllChats,
    createGroupChat,
    renameGroupChat,
    removeFromGroup,
    addUserToGroup
} = require('../controller/chatController');
const authMiddleware = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');

class ChatAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', authMiddleware(Object.values(ROLES)), fetchAllChats);

        this.router.post('/', authMiddleware(Object.values(ROLES)), accessChat);
        this.router.post('/group', authMiddleware(Object.values(ROLES)), createGroupChat);

        this.router.put('/rename', authMiddleware(Object.values(ROLES)), renameGroupChat);
        this.router.put('/remove-user', authMiddleware(Object.values(ROLES)), removeFromGroup);
        this.router.put('/add-user', authMiddleware(Object.values(ROLES)), addUserToGroup);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/chat';
    }
}

module.exports = ChatAPI;
