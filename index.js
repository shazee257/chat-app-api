const express = require('express');
const cors = require('cors');
const API = require('./api');
const http = require("http");
const socketIO = require('./socket');
const connectDB = require('./config/dbConnect');
const cookieSession = require('cookie-session');
const { notFound, errorHandler } = require('./middlewares/errorHandling');
const { log } = require('./middlewares/log');
require("dotenv").config();

const PORT = process.env.PORT;

// initialize express app
const app = express();

// connect to database
connectDB();

// initialize http server
const server = http.createServer(app);
socketIO(server);

// set up middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE_KEY],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));

app.use(cors({ origin: "*", credentials: true }));

app.get('/', (req, res) => res.json({ message: `Welcome to the ${process.env.APP_NAME} using socket.io!` }));

app.use(log);
new API(app).registerGroups();
app.use(notFound);
app.use(errorHandler);

// listen to port
server.listen(PORT, console.log(`Server running on port ${PORT}`.yellow.bold));