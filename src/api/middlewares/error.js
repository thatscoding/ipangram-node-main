import ErrorHandler from "../utils/errorHandle.js";

const error = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong Mongodb id error
  if (err.name === "CastError") {
    const message = `Resouce not found. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    // error: err.stack,
  });
};

export default error;
