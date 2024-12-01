const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");

// Schema Definition
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  passwordSalt: {
    type: String, // Salt for password hashing
    required: true,
  },
});


// Middleware to hash passwords before saving
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  // Generate a salt
  this.passwordSalt = crypto.randomBytes(16).toString("hex");

  // Hash the password using the salt
  this.password = crypto
    .pbkdf2Sync(this.password, this.passwordSalt, 10000, 64, 'sha512')
    .toString("hex");

  // Remove confirmPassword field
  this.confirmPassword = undefined;
  next();
});

// Instance method to verify passwords during login
userSchema.methods.correctPassword = function (candidatePassword) {
  const hash = crypto
    .pbkdf2Sync(candidatePassword, this.passwordSalt, 10000, 64, "sha512")
    .toString("hex");
  return hash === this.password;
};

// Compile the model
module.exports = mongoose.model('User', userSchema);


