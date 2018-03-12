const { graphql } = require('graphql');
const mongoose = require('mongoose');

module.exports.run = (schema, query) => graphql(schema, query);

module.exports.connect = () => new Promise((resolve, reject) => {
  const host = process.env.MONGO_HOST || 'localhost';
  const dbName = 'graphql-advanced-projection-example';

  mongoose.connection.on('connected', () => {
    resolve();
  });

  try {
    mongoose.connect(`mongodb://${host}:27017/${dbName}`, {
      autoReconnect: true,
      reconnectTries: 0,
      reconnectInterval: 100,
    }).then(resolve, reject);
  } catch (e) {
    reject(e);
  }
});
