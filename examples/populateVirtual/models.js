const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  _id: String,
  mongoD: String,
});

const UserSchema = new mongoose.Schema({
  _id: String,
  itemsId: [String], // For testing purpose only
});

UserSchema.virtual('items', {
  ref: 'items',
  localField: 'itemsId',
  foreignField: '_id',
  justOne: false,
});

module.exports = {
  Item: mongoose.model('items', ItemSchema),
  User: mongoose.model('users', UserSchema),
};
