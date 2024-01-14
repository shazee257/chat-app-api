import { fetchAllUsers } from '../controllers/index.js';
import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

export default class UserAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', authMiddleware(Object.values(ROLES)), fetchAllUsers);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}