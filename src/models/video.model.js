import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {},
  {
    timestamps: true,
  },
);

export const video = mongoose.model("video", videoSchema);
