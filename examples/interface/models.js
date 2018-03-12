const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: String,
  type: String, // ['admin', 'normal']
  mongoA: Number,
  mongoB: String,
  mongoC: String,
});

module.exports = {
  User: mongoose.model('users', UserSchema),
};
