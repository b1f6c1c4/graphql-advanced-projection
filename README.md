# graphql-advanced-projection

> Fully customizable MongoDB projection generator.

## Installation

```sh
$ yarn add graphql-advanced-projection
```
## Usage

```js
const _ = require('lodash');
const { genResovlers, genProjection } = require('graphql-advanced-projection');

const config = {
  // User
  User: {
    proj: {
      userId: '_id',
      a: 'extra.a', // Simple syntax for nested docs
      items: {
        // Always query 'status' if client ask for items
        // Very helpful for checking preconditions
        query: 'status',
        // Dive into 'Item'
        recursive: true,
      },
    },
  },

  // User
  // This is actually part of 'users' collection
  // So everything is based on 'User'
  Item: {
    prefix: 'items.',
    typeProj: 'type', // Polymorphism
  },

  // User
  ItemA: {
    prefix: 'items.',
    proj: {
      values: 'data',
      firstValue: {
        query: 'data',
        select: 'date[0]', // More config, less code
      },
    },
  },
};

const project = genProjection(config);

module.exports = {
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
        if (parent.status !== 'ALLOWED') {
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
          default:
            return null;
        }
      },
    },
  }),
};
```

## License

MIT
