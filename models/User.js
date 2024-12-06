const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');

// Schema Definition
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  passwordSalt: {
    type: String, // Salt for password hashing
    required: true,
  },
  memeUrls: [{
    type: String, // Store meme URLs in an array of strings
   
  }],
  
});

// Instance method to verify passwords during login
userSchema.methods.correctPassword = function (candidatePassword) {
  const hashedCandidatePassword = crypto
    .pbkdf2Sync(candidatePassword, this.passwordSalt, 10000, 64, 'sha512')
    .toString('hex');
  return hashedCandidatePassword === this.password;
};

// Compile the model
module.exports = mongoose.model('User', userSchema);
