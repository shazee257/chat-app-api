const router = require('express').Router();
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
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        router.get('/', authMiddleware(Object.values(ROLES)), fetchAllChats);

        router.post('/', authMiddleware(Object.values(ROLES)), accessChat);
        router.post('/group', authMiddleware(Object.values(ROLES)), createGroupChat);

        router.put('/rename', authMiddleware(Object.values(ROLES)), renameGroupChat);
        router.put('/remove-user', authMiddleware(Object.values(ROLES)), removeFromGroup);
        router.put('/add-user', authMiddleware(Object.values(ROLES)), addUserToGroup);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/chat';
    }
}

module.exports = ChatAPI;
