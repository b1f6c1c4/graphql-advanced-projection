const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User } = require('./models');
const gqlProjection = require('../..');

const { project, resolvers } = gqlProjection({
  User: {
    typeProj: 'type',
    proj: {
      field1: { query: 'mongoA' },
    },
  },
  AdminUser: {
    proj: {
      field1: 'mongoA',
      field2: 'mongoB',
    },
  },
  NormalUser: {
    proj: {
      field1: 'mongoA',
      field3: 'mongoC',
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
      __resolveType(parent) {
        switch (parent.type) {
          case 'admin':
            return 'AdminUser';
          case 'normal':
            return 'NormalUser';
          default:
            return null;
        }
      },
    },
  }),
  resolverValidationOptions: { requireResolversForResolveType: false },
});
