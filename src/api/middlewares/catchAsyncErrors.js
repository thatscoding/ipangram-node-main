export const catchAsyncError = (thefunc) => {
  return (req, res, next) => {
    thefunc(req, res, next).catch((error) => {
      next(error); // Pass the caught error to the next middleware
    });
  };
};
