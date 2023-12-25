class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Call Error.captureStackTrace after super() to correctly set the stack trace.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
