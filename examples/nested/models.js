const mongoose = require('mongoose');

const NestedSchema = new mongoose.Schema({
  mongoC: Number,
});

const UserSchema = new mongoose.Schema({
  _id: String,
  mongoA: String,
  nested: [NestedSchema],
});

module.exports = {
  User: mongoose.model('users', UserSchema),
};
