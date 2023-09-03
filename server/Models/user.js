const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, default: null },
  password: { type: String, default: null },
  otp: { type: String, default: null }
}, { collection: 'user' });

module.exports = mongoose.model('User', userSchema);

