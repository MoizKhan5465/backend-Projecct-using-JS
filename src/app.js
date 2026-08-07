import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "50mb",
  }),
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);

app.use(express.static("public"));

app.use(cookieParser());

import userRouter from "./routes/user.routes.js";


app.use("/api/v1/", userRouter);

export { app };
