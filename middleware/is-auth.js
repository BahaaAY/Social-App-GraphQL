const jwt = require("jsonwebtoken");
const { catchErr } = require("../util/errorHandler");

const JWT_SECRET = require("../util/credentials").JWT_SECRET;

const errorHandler = require("../util/errorHandler").errorHandler;
module.exports = (req, res, next) => {
  let authHeader = req.get("Authorization");
  try {
    if (!authHeader) {
      // No authorization header
      return errorHandler(401, "Invalid Header!");
    }
    let token = authHeader.split(" ")[1];
    let decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken) {
      // Invalid token
      return errorHandler(401, "Invalid Token!");
    }
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    catchErr(err, next);
  }
};
