const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const User = require('./models/User.js'); // Path to your User model
const path = require('path')
const app = express();
const PORT = 3000;
const JWT_SECRET = "your_secret_key"; // Replace with a strong secret

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://hoo69:hoo.rn123y@level1.nwa7e.mongodb.net/').then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// Signup Endpoint
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,"index.html"))
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { email, password, confirmPassword } = req.body;
  
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }
   
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use!" });
      }
  
      // Create new user
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

      const newUser = new User({
        email,
        password: hashedPassword,
        passwordSalt: hashedPassword,
      });
  
      await newUser.save();
      res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
      res.status(500).json({ message: "Error creating user", error: err.message });
    }
  });
  

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log(user.password)
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Hash the incoming password using the stored salt
    const hashedPassword = crypto.pbkdf2Sync(password, user.passwordSalt, 10000, 64, 'sha512').toString('hex');
    console.log(hashedPassword)
    console.log(user.password)
    if (user.password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: "Login successful!", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Protected Route Example
app.get('/protected', (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ message: "Protected data", user: decoded });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
