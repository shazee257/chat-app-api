const { Router } = require('express');
const { defaultHandler } = require('../controller/rootController');

class RootAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', defaultHandler);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/';
    }
}

module.exports = RootAPI;
