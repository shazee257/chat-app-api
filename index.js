import connectDB from "./config/database.config.js";
import { httpServer } from "./app.js";

// set port
const PORT = process.env.PORT || 5000;

// connect to database
connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
});