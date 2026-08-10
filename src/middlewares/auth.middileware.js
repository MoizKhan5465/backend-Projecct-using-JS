import jwt from "jsonwebtoken";
import { user } from "../models/user.model.js";
import { APIerror as AppError } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asynchandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accesstoken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(
      new AppError(401, "You are not logged in! Please log in to get access."),
    );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);

    const foundUser = await user
      .findById(decodedToken._id)
      .select("-password -refreshToken");

    if (!foundUser) {
      return next(
        new AppError(
          401,
          "The user belonging to this token does no longer exist.",
        ),
      );
    }

    req.user = foundUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError(401, "Invalid token. Please log in again."));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expired. Please log in again."));
    }
    return next(new AppError(401, "Authentication failed."));
  }
});
