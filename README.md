# graphql-advanced-projection

> Fully customizable MongoDB projection generator.

## Installation

```sh
$ yarn add graphql-advanced-projection
```
## Usage

```js
const _ = require('lodash');
const { makeExecutableSchema } = require('graphql-tools');
const { genResolvers, genProjection } = require('graphql-advanced-projection');

const config = {
  User: {
    proj: {
      // Basic syntax: <gqlField>:'<mongoField>'
      userId: '_id',
      a: 'extra.a', // Simple syntax for nested docs
      items: {
        // Always query 'status1', 'status2' if client ask for items
        // Very helpful for checking preconditions
        query: ['status1', 'status2'],
        // Dive into 'Item'
        recursive: true,
      },
    },
  },

  Item: {
    prefix: 'items.',
    typeProj: 'type', // Polymorphism
  },

  ItemA: {
    prefix: 'items.',
    proj: {
      values: 'data',
      first: {
        query: 'data',
        select: 'data[0]',
      },
    },
  },
};

const project = genProjection(config);

const typeDefs = `
type Query {
  user: User
}
type User {
  userId: String # Query '_id' and select that
  a: String      # Query 'extra.a' and select that
  simple: Int    # Query 'simple' and select that
  items: [Item]  # Query 'status1' and 'status2'
}
interface Item { # Query 'items.type'
  foobar: String # Query 'items.foobar' and select that
}
type ItemA implements Item {
  foobar: String
  barfoo: String # Query 'items.barfoo' and select that
  values: [Int]  # Query 'items.data' and select that
  first: Int     # Query 'items.data' and select 'items.data[0]'
}
type ItemB implements Item {
  foobar: String
}
`;

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers: _.merge(genResolvers(config), {
    Query: {
      async user(parent, args, context, info) {
        const proj = project(info);
        const result = await User.findById(args.id, proj);
      },
    },
    User: {
      items(parent) {
        // You may add some logic here.
        if (parent.status1 !== parent.status2) {
          return new Error('Status not allowed');
        }
        // If you wonder why we can use 'items' without specifing proj 'items':
        // Since graphql enforces that at least one field of 'Item' been selected,
        // at least one projection of /^items\./ will be added
        // thus `parent.items` must exists.
        return parent.items;
      },
    },
    Item: {
      __resolveType(parent) {
        switch (parent.type) {
          case 'typeA':
            return 'ItemA';
          case 'typeB':
            return 'ItemB';
          default:
            return null;
        }
      },
    },
  }),
});
```

## License

MIT
