# graphql-advanced-projection

[![npm](https://img.shields.io/npm/v/graphql-advanced-projection.svg?style=flat-square)](https://www.npmjs.com/package/graphql-advanced-projection)
[![Travis](https://img.shields.io/travis/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://travis-ci.org/b1f6c1c4/graphql-advanced-projection)
[![Coveralls](https://img.shields.io/coveralls/github/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://coveralls.io/github/b1f6c1c4/graphql-advanced-projection)

> Fully customizable MongoDB projection generator.

## Why

We already have [graphql-projection](https://github.com/bharley/graphql-projection), [graphql-mongodb-projection](https://github.com/du5rte/graphql-mongodb-projection), and [graphql-db-projection](https://github.com/markshapiro/graphql-db-projection).
But `graphql-advanced-projection` is different from all of them above in the following ways:
* **Separete graphql schema and mongodb projection config.** This helps you decouple schema and mongodb into two parts, each of them may change independently. Write graphql in `.graphql`, write config in javascript or `.json`.
* **Easy customization.** No more `gqlField: { type: new GraphQLNonNull(GraphQLInt), projection: 'mongoField' }`. Simply `gqlField: 'mongoField'`.
* **We create resolvers.** `gqlField: (parent) => parent.mongoField` can be automatically generated, even complicated ones like `first: (parent) => parent.items.data[0].value`.
* **Fully supports interfaces, fragments, and inline fragments.** Write `typeProj: 'type'` and `switch (parent.type)` in `__resolveType`.

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
      evil: null, // Don't project anyway
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
  evil: String   # No query
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
