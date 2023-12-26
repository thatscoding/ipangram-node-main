import ErrorHandler from "../utils/errorHandle.js";
import { catchAsyncError } from "./catchAsyncErrors.js";

export const isUserAuthorize = catchAsyncError(async (req, res, next) => {
  const { department } = req.user;
  const role = department ? department : null;

  if (!role || role.toLowerCase() !== "manager") {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  //  store the user's role in the request for future use
  req.userRole = role.toLowerCase();

  next();
});
