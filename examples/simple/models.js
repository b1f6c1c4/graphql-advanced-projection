const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: String,
  mongoA: String,
});

module.exports = {
  User: mongoose.model('users', UserSchema),
};
