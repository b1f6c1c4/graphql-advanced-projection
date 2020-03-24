const mongoose = require('mongoose');

const SubItemSchema = new mongoose.Schema({
  _id: String,
  c: String,
});

const ItemSchema = new mongoose.Schema({
  _id: String,
  mongoD: String,
  subsId: [String], // For testing purpose only
});

ItemSchema.virtual('subs', {
  ref: 'sub-items',
  localField: 'subsId',
  foreignField: '_id',
  justOne: false,
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
  SubItem: mongoose.model('sub-items', SubItemSchema),
  Item: mongoose.model('items', ItemSchema),
  User: mongoose.model('users', UserSchema),
};
