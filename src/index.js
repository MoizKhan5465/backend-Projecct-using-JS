import connectDB from "./db/index.js";
import dotenv from "dotenv";


dotenv.config({
    path: "./.env",
});
console.log("Loaded URI:", process.env.MONGO_DB_URI);
connectDB();

