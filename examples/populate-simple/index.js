const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../..');

const { populator, resolvers } = gqlProjection({
  User: {
    proj: {
      items: 'itemsId',
    },
  },
  Item: {
    proj: {
      itemId: '_id',
      field4: 'mongoD',
      subs: 'subsId',
    },
  },
  SubItem: {
    proj: {
      content: 'c',
    },
  },
});

module.exports = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8'),
  resolvers: _.merge(resolvers, {
    Query: {
      async user(parent, args, context, info) {
        const { proj, popu } = populator(info);
        let promise = User.findById(args.id, proj);
        if (popu) {
          promise = promise.populate(popu);
        }
        return promise;
      },
    },
  }),
  resolverValidationOptions: { requireResolversForResolveType: false },
});
