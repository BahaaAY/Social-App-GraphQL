const fs = require("fs");
const { catchErr } = require("./errorHandler");
const errorHandler = require("./errorHandler").errorHandler;

module.exports = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      errorHandler(500, "Deleting image failed.");
    }
  });
};
