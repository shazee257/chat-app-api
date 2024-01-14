import { Router } from 'express';
import RootAPI from './root/root.route.js';
import AuthAPI from './auth/auth.route.js';
import UserAPI from './user/user.route.js';
import ChatAPI from './chat/chat.route.js';
import MessageAPI from './message/message.route.js';

export default class API {
    constructor(app) {
        this.app = app;
        this.router = Router();
        this.routeGroups = [];
    }

    loadRouteGroups() {
        this.routeGroups.push(new RootAPI());
        this.routeGroups.push(new AuthAPI());
        this.routeGroups.push(new UserAPI());
        this.routeGroups.push(new ChatAPI());
        this.routeGroups.push(new MessageAPI());
    }

    setContentType(req, res, next) {
        res.set('Content-Type', 'application/json');
        next();
    }

    registerGroups() {
        this.loadRouteGroups();
        this.routeGroups.forEach((rg) => {
            console.log('Route group: ' + rg.getRouterGroup());
            this.app.use('/api' + rg.getRouterGroup(), this.setContentType, rg.getRouter());
        });
    }
}