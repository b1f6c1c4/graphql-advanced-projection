const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { User, Item } = require('./models');
const {
  prepareConfig,
  genProjection,
  genResolvers,
} = require('../../');

const config = prepareConfig({
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
const project = genProjection(config);
const resolvers = genResolvers(config);

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
        const fetchItem = async (id) => {
          const result = await Item.findById(id, proj);
          return result.toObject();
        };
        const results = await Promise.all(parent.itemsId.map(fetchItem));
        return results;
      },
    },
  }),
});
