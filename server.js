const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const User = require("./models/User");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "your_secret_key";
const CLIENT_URL = "https://meme-generator-6p8s.onrender.com";
const MONGO_URI = "mongodb+srv://hoo69:hoo.rn123y@level1.nwa7e.mongodb.net/";

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

const CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }));

app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(MONGO_URI).then(() => console.log("MongoDB connected")).catch((err) => console.log(err));

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.id);
          if (!user) return res.status(401).json({ message: "User not found" });
          req.user = user;
          next();
    } catch (err) {
          return res.status(401).json({ message: "Invalid or expired token" });
    }
};

app.get("/", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.post("/signup", async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match!" });
    try {
          const existingUser = await User.findOne({ email });
          if (existingUser) return res.status(400).json({ message: "Email is already in use!" });
          const salt = crypto.randomBytes(16).toString("hex");
          const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
          const newUser = new User({ email, password: hashedPassword, passwordSalt: salt });
          await newUser.save();
          res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
          res.status(500).json({ message: "Error creating user", error: err.message });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
          const user = await User.findOne({ email });
          if (!user) return res.status(404).json({ message: "User not found!" });
          const hashedPassword = crypto.pbkdf2Sync(password, user.passwordSalt, 10000, 64, "sha512").toString("hex");
          if (user.password === hashedPassword) {
                  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "100h" });
                  res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" });
                  res.status(200).json({ message: "Login successful!" });
          } else {
                  res.status(401).json({ message: "Invalid credentials!" });
          }
    } catch (err) {
          res.status(500).json({ message: "Error logging in", error: err.message });
    }
});

app.post("/save-meme-url", verifyToken, async (req, res) => {
    const { memeUrl } = req.body;
    if (!memeUrl) return res.status(400).json({ message: "Meme URL is required" });
    try {
          req.user.memeUrls.push(memeUrl);
          await req.user.save();
          res.status(200).json({ message: "Meme URL saved successfully!", memeUrls: req.user.memeUrls });
    } catch (err) {
          res.status(500).json({ message: "Error saving meme URL", error: err.message });
    }
});

app.get("/get-saved-memes", verifyToken, async (req, res) => {
    try {
          res.status(200).json(req.user.memeUrls);
    } catch (err) {
          res.status(500).json({ message: "Error fetching saved memes", error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
