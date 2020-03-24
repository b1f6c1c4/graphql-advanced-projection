const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  _id: String,
  mongoD: String,
  subsId: [{
    type: String,
    ref: 'sub-items',
  }],
});

const SubItemSchema = new mongoose.Schema({
  _id: String,
  content: String,
});

const UserSchema = new mongoose.Schema({
  _id: String,
  itemsId: [{
    type: String,
    ref: 'items',
  }],
});

module.exports = {
  SubItem: mongoose.model('sub-items', SubItemSchema),
  Item: mongoose.model('items', ItemSchema),
  User: mongoose.model('users', UserSchema),
};
