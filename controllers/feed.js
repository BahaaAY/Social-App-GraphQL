const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const errorHandler = require("../util/errorHandler").errorHandler;
const postAuth = require("../util/auth").postAuth;
const clearImage = require("../util/clearImage");
const { catchErr } = require("../util/errorHandler");

const io = require("../socket");
const { isObjectIdOrHexString } = require("mongoose");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();

    const posts = await Post.find()
      .limit(perPage)
      .sort({ createdAt: -1 }) // -1 means descending order
      .skip((currentPage - 1) * perPage)
      .populate("creator", "name");
    // Status code 200 means everything is ok
    return res.status(200).json({
      message: "Fetched posts successfully.",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    catchErr(err, next);
  }
};

exports.createPost = async (req, res, next) => {
  console.log("Creating Post!");
  // Create post in db
  const title = req.body.title;
  const content = req.body.content;
  const userId = req.userId;
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      // Status code 422 means something went wrong with the validation
      return errorHandler(
        422,
        "Validation failed, entered data is incorrect.",
        next
      );
    }
    if (!req.file) {
      // Status code 422 means something went wrong with the validation
      return errorHandler(422, "No image provided.", next);
    }

    const post = new Post({
      title: title,
      content: content,
      imageUrl: req.file.path,
      creator: userId,
    });
    await post.save();
    const user = await User.findById(userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: userId, name: user.name } },
    });
    return res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: user,
    });
  } catch (err) {
    catchErr(err, next);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId).populate("creator", "name");
    if (!post) {
      // Status code 404 : Post not found!
      return errorHandler(404, "Post not found!", next);
    }
    // Status code 200 means everything is ok
    return res.status(200).json({
      message: "Post fetched.",
      post: post,
    });
  } catch (err) {
    catchErr(err, next);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.userId;
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      // Status code 422 means something went wrong with the validation
      return errorHandler(422, "Validation failed, entered data is incorrect.");
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
      imageUrl = req.file.path;
    }
    if (!imageUrl || imageUrl === "undefined") {
      // Status code 422 means something went wrong with the validation
      return errorHandler(422, "No Image provided!", next);
    }
    console.log("Updating Post!: ", postId, title, content, imageUrl);
    const post = await Post.findById(postId).populate("creator", "name");
    if (!post) {
      // Status code 404 : Post not found!
      return errorHandler(404, "Post not found!", next);
    }
    post.title = title;
    post.content = content;
    postAuth(post, userId);
    if (imageUrl != post.imageUrl) {
      // Delete old image
      console.log("Deleting old image!");
      clearImage(post.imageUrl, next);
    }
    post.imageUrl = imageUrl;
    const savedResult = await post.save();
    io.getIO().emit("posts", { action: "update", post: post });
    // Status code 200 means everything is ok
    return res.status(200).json({
      message: "Post updated!",
      post: savedResult,
    });
  } catch (err) {
    catchErr(err, next);
  }
};
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.userId;
  try {
    console.log("Deleting Post!: ", postId);
    if (!postId) {
      return errorHandler(404, "Post not found!", next);
    }
    const post = await Post.findById(postId);
    if (!post) {
      // Status code 404 : Post not found!
      return errorHandler(404, "Post not found!", next);
    }

    //check if user is post owner
    postAuth(post, userId);

    await Post.deleteOne({ _id: postId });
    const user = await User.findById(post.creator);
    // Delete from user posts
    user.posts.pull(post._id);
    await user.save();
    // Delete post image
    console.log("Deleting post image!");
    clearImage(post.imageUrl);

    io.getIO().emit("posts", {
      action: "delete",
      post: postId,
    });
    // Status code 200 means everything is ok
    return res.status(200).json({
      message: "Post deleted!",
    });
  } catch (err) {
    catchErr(err, next);
  }
};

exports.getStatus = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return errorHandler(404, "User Not Found");
    }
    res.status(200).json({
      message: "Status Retreived Successfully",
      status: user.status,
    });
  } catch (err) {
    catchErr(err, next);
  }
};

exports.updateStatus = async (req, res, next) => {
  const userId = req.userId;
  const newStatus = req.body.status;
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      // Status code 422 means something went wrong with the validation
      return errorHandler(422, "Validation failed, entered data is incorrect.");
    }
    console.log("Updating Status!: ", userId, newStatus);
    const user = await User.findById(userId);
    if (!user) {
      return errorHandler(404, "User Not Found");
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({
      message: "Status Updated Successfully",
      status: newStatus,
    });
  } catch (err) {
    catchErr(err, next);
  }
};
