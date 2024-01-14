import { sendMessage, fetchAllMessages } from '../controllers/index.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/index.js';
import { ROLES } from '../utils/constants.js';

export default class MessageAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/:chatId', authMiddleware(Object.values(ROLES)), fetchAllMessages);

        this.router.post('/', authMiddleware(Object.values(ROLES)), sendMessage);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/message';
    }
}