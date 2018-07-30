const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../../');

const { parseInfo, resolvers } = gqlProjection({
  User: {
    proj: {
      items: 'itemsId.',
    },
  },
  Item: {
    proj: {
      itemId: '_id',
      field4: 'mongoD',
      subs: 'subsId.',
    },
  },
});

module.exports = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8'),
  resolvers: _.merge(resolvers, {
    Query: {
      async user(parent, args, context, info) {
        const { projection, population } = parseInfo(info);
        return User.findById(args.id, projection).populate(population);
      },
    },
  }),
});
