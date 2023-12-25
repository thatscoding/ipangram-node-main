import mongoose from "mongoose";

export const connectDB = async (url) => {
  await mongoose.connect(url);
  console.log("DB connected successfully");
};
