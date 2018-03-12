const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  _id: String,
  mongoD: String,
});

const UserSchema = new mongoose.Schema({
  _id: String,
  itemsId: [String], // ItemSchema._id
});

module.exports = {
  Item: mongoose.model('items', ItemSchema),
  User: mongoose.model('users', UserSchema),
};
