const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User, Item } = require('./models');
const gqlProjection = require('../../');

const { projects, resolvers } = gqlProjection({
  User: {
    proj: {
      items: {
        query: 'itemsId',
        reference: true,
      },
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
        const projs = projects(info);
        const result0 = await User.findById(args.id, projs['']);
        if ('items' in projs) {
          const result1 = await Item.find({ _id: { $in: result0.itemsId } }, projs.items);
          result0.items = result1;
          return result0;
        }
        return result0;
      },
    },
    User: {
      field3: () => '',
    },
  }),
});
