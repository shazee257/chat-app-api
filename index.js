const connectDB = require('./config/dbConnect');
const { httpServer } = require('./app');
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// connect to database
connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
});