import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadonclodinary = async (localfilepath) => {
  try {
    if (!localfilepath) {
      throw new Error("File path is required");
    }
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully");
    console.log(response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    console.error("Error uploading file to Cloudinary:", error);
    throw error;
  }
};

export { uploadonclodinary };
