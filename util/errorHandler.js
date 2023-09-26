exports.errorHandler = (statusCode, err) => {
  console.log("Handling Error!");
  let error;
  if (err instanceof Error) {
    // Error is an Error object
    error = err;
  } else {
    // Error is a string
    error = new Error(err);
  }
  error.statusCode = statusCode;
  throw error;
};
exports.catchErr = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  next(err);
};
