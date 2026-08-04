import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const baseUri = process.env.MONGO_DB_URI;
    const connectionUri = `${baseUri}/${DB_NAME}?retryWrites=true&w=majority`;
    const DbConnectionResponse = await mongoose.connect(connectionUri);
    console.log(
      `\n MongoDB connected !!! DB HOST ${DbConnectionResponse.connection.host} \n`,
    );
  } catch (error) {
    console.log("MONGODB connection error ", error);
    process.exit(1);
  }
};

export default connectDB;
