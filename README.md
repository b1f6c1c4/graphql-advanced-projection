# graphql-advanced-projection

> Fully customizable MongoDB projection generator.

## Installation

```sh
$ yarn add --dev graphql-advanced-projection
```
## Usage

```js
const projector = require('graphql-advanced-projection');

const project = projector({
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
    prefix: 'item.',
    typeProj: 'type', // Polymorphism
  },

  // User
  ItemA: {
    prefix: 'item.',
    proj: {
      values: 'data',
      firstValue: {
        query: 'data',
        select: 'date[0]', // More config, less code
      },
    },
  },
});

module.exports = {
  resolvers: {
    Query: {
      async user(parent, args, context, info) {
        const proj = project(info);
        await User.findById(args.id, proj);
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
  },
};
```

## License

MIT
