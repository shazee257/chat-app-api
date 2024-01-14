import { fetchAllChats, accessChat, createGroupChat, renameGroupChat, removeFromGroup, addUserToGroup } from '../../controllers/index.js';
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/index.js';
import { ROLES } from '../../utils/constants.js';
import { validate } from '../../validators/validate.js';
import { mongoIdRequestBodyValidator } from '../../validators/index.js';

export default class ChatAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', authMiddleware(Object.values(ROLES)), fetchAllChats);

        this.router.post('/', authMiddleware(Object.values(ROLES)), [mongoIdRequestBodyValidator('user'), validate], accessChat);
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
