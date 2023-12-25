import ErrorHandler from "../utils/errorHandle.js";
import { verifyToken } from "../utils/generateToken.js";
import { catchAsyncError } from "./catchAsyncErrors.js";

export const isUserAuthenticate = catchAsyncError(async (req, res, next) => {
  // const token = req.body.token;
  // const token = req.cookies.token;
  const authorizationHeader = req.headers["authorization"];

  if (!authorizationHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    return next(new ErrorHandler("Token not found!", 401));
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return next(new ErrorHandler("Invalid Token!", 401));
  }
  // console.log(payload);
  req.user = payload;
  next();
});
