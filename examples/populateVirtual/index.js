const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../..');

const { project, resolvers } = gqlProjection({
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
        const proj = project(info);
        const result = await User.findById(args.id, proj);
        return result.toObject();
      },
    },
    User: {
      async items(parent, args, context, info) {
        const proj = project(info);
        if (_.keys(proj).length === 1) {
          // Only itemId is inquired.
          // Save some db queries!
          return parent.itemsId.map((id) => ({ _id: id }));
        }
        await User.populate(parent, { path: 'items', select: proj });
        return parent.items;
      },
    },
  }),
});
