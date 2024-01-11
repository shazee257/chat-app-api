const express = require('express');
const cors = require('cors');
const API = require('./api');
const { createServer } = require("http");
const { Server } = require("socket.io");
const cookieSession = require('cookie-session');
const { notFound, errorHandler } = require('./middlewares/errorHandling');
const { log } = require('./middlewares/log');
const { rateLimiter } = require('./config/rateLimiter');
const requestIp = require("request-ip");
require("dotenv").config();

// initialize express app
const app = express();

// initialize http server
const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000, // 60 seconds
    cors: {
        origin: "*",
        credentials: true
    },
});

// using set method to mount the `io` instance on the app to avoid usage of `global`
app.set("io", io);

// set up middlewares
app.use(requestIp.mw());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_KEY],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));
app.use(cors({ origin: "*", credentials: true }));
app.use(rateLimiter);

app.get('/', (req, res) => res.json({ message: `Welcome to the ${process.env.APP_NAME} using socket.io!` }));

app.use(log);
new API(app).registerGroups();
app.use(notFound);
app.use(errorHandler);

module.exports = { httpServer };