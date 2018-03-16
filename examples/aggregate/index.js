const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../../');

const { pipeline, resolvers } = gqlProjection({
  User: {
    proj: {
      items: { query: 'itemsId' },
    },
  },
  Item: {
    proj: {
      itemId: '_id',
      field4: 'mongoD',
    },
  },
});

module.exports = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8'),
  resolvers: _.merge(resolvers, {
    Query: {
      async user(parent, args, context, info) {
        const pipe = pipeline(info);
        const result = await User.aggregate([
          { $match: { _id: args.id } },
          ...pipe,
        ]);
        return result.toObject();
      },
    },
  }),
});
