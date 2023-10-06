const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const { createHandler } = require("graphql-http/lib/use/express");
const schema = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

const fileFilter = require("./util/fileFilter");
const { catchErr } = require("./util/errorHandler");
const username = require("./util/credentials").username;
const password = require("./util/credentials").password;

const MONGODB_URI = `mongodb+srv://${username}:${password}@cluster0.o8mxmhh.mongodb.net/social`;

const app = express();

// Multer config
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

app.use((req, res, next) => {
  // Fix CORS error
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use(bodyParser.json()); // parse application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
); // parse multipart/form-data (file upload)
app.use("/images", express.static(path.join(__dirname, "images")));

// Error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data || [];
  res.status(status).json({ message: message, data: data });
});

// GraphQL
app.use(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: resolvers,
    formatError: (err) => {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occurred";
      const code = err.originalError.code || 500;
      return { message: message, data: data, code: code };
    },
  })
);

const connectDB = async () => {
  try {
    //if try works
    await mongoose.connect(MONGODB_URI);
    console.log("Mongodb Connected...");
    app.listen(8080);
  } catch (err) {
    //if try fails
    err.statusCode = 500;
    console.log(err);
    //exit process with failure
    process.exit(1);
  }
};

connectDB();
