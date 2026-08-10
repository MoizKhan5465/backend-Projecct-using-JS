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

const generateaccessandrefreshtoken = (userID) => {
  try {
    const user = await user.findById(userID);
    
    if (!user) {
      throw new APIerror(404, "User not found");
    }
    const accessToken=user.generateaccesstoken();
    const refreshToken = user.generaterefreshtoken();
    
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false});

    return { accessToken, refreshToken };

  } catch (error) {
    throw new APIerror(500, "Failed to generate tokens");
  }
};
const loginuser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new APIerror(400, "Please provide email or username");
  }

  const UserAvaibleOrNot = await user.findOne({
    $or: [{ email }, { username }],
  });

  if (!UserAvaibleOrNot) {
    throw new APIerror(404, "User with these credentials not found");
  }
  const isPasswordValid = await UserAvaibleOrNot.ispasswordcorrect(password);
  if (!isPasswordValid) {
    throw new APIerror(401, "Invalid password");
  }

  const { accessToken, refreshtoken } = await generateaccessandrefreshtoken(UserAvaibleOrNot._id)
  
  const loginsuser=await user.findByID(UserAvaibleOrNot._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure:true
  }

  return res.status(200).cookie("refreshToken", refreshtoken, options).cookie("accesstoken",accessToken,options).json(new APIresponse(200, { user:loginuser,accessToken,refreshtoken }, "User logged in successfully"))
});

const logout = asyncHandler(async (req, res) => { 
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
    refreshToken: null
    }
  }, { new: true })
  

   const options = {
    httpOnly: true,
    secure:true
  }

  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new APIresponse(200, null, "User logged out successfully"))
  

})

export { loginuser, logout, registerUser };

