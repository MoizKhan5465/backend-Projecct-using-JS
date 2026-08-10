import { user } from "../models/user.model.js";
import { APIerror } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadonclodinary } from "../utils/Cloudnary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  if (!fullname || !email || !password || !username) {
    throw new APIerror(400, "Please provide all required fields");
  }

  const existeduser = await user.findOne({ $or: [{ username }, { email }] });
  if (existeduser) {
    throw new APIerror(409, "User already exists with this username or email");
  }

  const avtarlocalpath = req.files?.avtar?.[0]?.path;
  const coverimagelocalpath = req.files?.coverimage?.[0]?.path;

  if (!avtarlocalpath) {
    throw new APIerror(400, "Please provide avatar");
  }

  const avtarupload = await uploadonclodinary(avtarlocalpath);
  const coverimageupload = coverimagelocalpath
    ? await uploadonclodinary(coverimagelocalpath)
    : null;

  if (!avtarupload) {
    throw new APIerror(500, "Failed to upload avatar to Cloudinary");
  }

  const usercreation = await user.create({
    fullname,
    avtar: avtarupload.url,
    coverimage: coverimageupload?.url || null,
    email,
    password,
    username,
  });

  const createduser = await user
    .findById(usercreation._id)
    .select("-password -refreshToken");

  if (!createduser) {
    throw new APIerror(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new APIresponse(201, createduser, "User created successfully"));
});

const generateAccessAndRefreshToken = async (userID) => {
  const usr = await user.findById(userID);
  if (!usr) throw new APIerror(404, "User not found");

  const accessToken = usr.generateaccesstoken();
  const refreshToken = usr.generaterefreshtoken();

  usr.refreshToken = refreshToken;
  await usr.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new APIerror(400, "Please provide email or username");
  }

  const foundUser = await user.findOne({ $or: [{ email }, { username }] });
  if (!foundUser)
    throw new APIerror(404, "User with these credentials not found");

  const isPasswordValid = await foundUser.ispasswordcorrect(password);
  if (!isPasswordValid) throw new APIerror(401, "Invalid password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    foundUser._id,
  );

  const userForResponse = await user
    .findById(foundUser._id)
    .select("-password -refreshToken");

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accesstoken", accessToken, cookieOptions)
    .json(
      new APIresponse(
        200,
        { user: userForResponse, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
});

const logout = asyncHandler(async (req, res) => {
  await user.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true },
  );

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("accesstoken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new APIresponse(200, null, "User logged out successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies or Authorization header
  const incomingrefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!incomingrefreshToken) {
    throw new APIerror(401, "Refresh token is missing");
  }

  try {
    // Verify the refresh token
    const decodedRefreshToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // Find user by ID from the decoded token
    const foundUser = await user.findById(decodedRefreshToken._id);

    if (!foundUser) {
      throw new APIerror(401, "User not found");
    }

    // Check if the refresh token matches the one stored in database
    if (incomingrefreshToken !== foundUser.refreshToken) {
      throw new APIerror(401, "Invalid refresh token. Please log in again.");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(foundUser._id);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict", // Added for better security
    };

    // Get user data without sensitive info
    const userForResponse = await user
      .findById(foundUser._id)
      .select("-password -refreshToken");

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accesstoken", accessToken, options)
      .json(
        new APIresponse(
          200,
          {
            user: userForResponse,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw new APIerror(
        401,
        "Invalid or expired refresh token. Please log in again.",
      );
    }
    throw new APIerror(500, error.message || "Internal server error");
  }
});

export { loginUser, logout, refreshToken, registerUser };
