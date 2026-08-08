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

export { registerUser };
