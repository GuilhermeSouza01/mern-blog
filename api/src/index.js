const express = require("express");
const cors = require("cors");
const { mongoose } = require("mongoose");

const Post = require("../models/Post");
const User = require("../models/User");

const brcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const cookieParser = require("cookie-parser");

const salt = brcrypt.genSaltSync(10);
const secret = "asjhgd879326t48723grysiuagrd987";

const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });

const fs = require("fs");
const PostModel = require("../models/Post");

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());

app.use(cookieParser());
app.use(express.static("api"));
app.use("/uploads", express.static("uploads"));

mongoose.connect(
  "mongodb+srv://blog:uzBcjQSkpFP4VnC8@cluster0.il9dqg9.mongodb.net/?retryWrites=true&w=majority"
);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: brcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const isPassTrue = brcrypt.compareSync(password, userDoc.password);
  if (isPassTrue) {
    //Logged in
    // res.status(200).json("ok");
    jwt.sign({ username, id: userDoc._id }, secret, {}, (error, token) => {
      if (error) throw error;
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (error, info) => {
    if (error) throw error;
    res.json(info);
  });
  // res.json(req.cookies);
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const extension = parts[parts.length - 1];
  const newPath = path + "." + extension;
  fs.renameSync(path, newPath);
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) throw error;
    const { title, summary, content } = req.body;
    const postDocument = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDocument);
  });
});

app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const extension = parts[parts.length - 1];
    newPath = path + "." + extension;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) throw error;
    const { id, title, summary, content } = req.body;
    const postDocument = await Post.findById(id);
    const isAuthor =
      JSON.stringify(postDocument.author) === JSON.stringify(info.id);

    if (!isAuthor) {
      return res.status(400).json("You are not the author");
    }
    await postDocument.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDocument.cover,
    });

    res.json(postDocument);
  });
});

app.get("/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

app.listen(3001, () =>
  console.log("🔥 Server started at http://localhost:3001")
);
//mongodb+srv://blog:uzBcjQSkpFP4VnC8@cluster0.il9dqg9.mongodb.net/?retryWrites=true&w=majority
