const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { User, Item } = require('./models');
const gqlProjection = require('../..');

const { project, resolvers } = gqlProjection({
  User: {
    proj: {
      items: true,
    },
  },
  Item: [
    ['user', {
      proj: {
        itemId: '_id',
        field4: 'mongoD',
      },
    }],
    ['item', {
      proj: {
        itemId: '_id',
        field4: 'mongoE',
      },
    }],
  ],
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
      async item(parent, args, context, info) {
        const proj = project(info);
        const result = await Item.findById(args.id, proj);
        return result.toObject();
      },
    },
  }),
  resolverValidationOptions: { requireResolversForResolveType: false },
});
