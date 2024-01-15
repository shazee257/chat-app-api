import mongoose from 'mongoose';
import asyncHandler from "express-async-handler";
import colors from "colors";

const connectDB = asyncHandler(async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`MongoDB Connected, DB -> : ${conn.connection.name}`.cyan.bold);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1);
    }
});

export default connectDB;