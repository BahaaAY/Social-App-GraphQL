const { catchErr } = require("./errorHandler");

const errorHandler = require("./errorHandler").errorHandler;
exports.postAuth = (post, userId) => {
  if (post.creator._id.toString() !== userId) {
    // Not authorized
    return errorHandler(403, "Not Authorized");
  }
};
