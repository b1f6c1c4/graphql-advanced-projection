const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../..');

const { project, resolvers } = gqlProjection({
  User: {
    proj: {
      userId: '_id',
      field1: 'mongoA',
      field2: null,
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
      field2: () => 'Hello World',
    },
  }),
  resolverValidationOptions: { requireResolversForResolveType: false },
});
