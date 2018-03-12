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

> For a complete working demo, see the `examples` folder.

### Setup `mongoose`
```js
const UserSchema = new mongoose.Schema({
  _id: String,
  mongoA: String,
});
const User = mongoose.model('users', UserSchema);
```

### Setup `graphql`
```graphql
type Query {
  user(id: ID!): User
}
type User {
  userId: ID
  field1: String
  field2: String
}
```

### Setup `graphql-advanced-projection`
```js
const { genResolvers, genProjection } = require('graphql-advanced-projection');

// Projection config
const config = {
  User: {
    proj: {
      userId: '_id',
      field1: 'mongoA',
      field2: null,
    },
  },
};
const project = genProjection(config);
const resolvers = genResolvers(config);
```

### Combine everything together

```js
const _ = require('lodash');
const { makeExecutableSchema } = require('graphql-tools');

module.exports = makeExecutableSchema({
  typeDefs,
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
});
```

### Run

```graphql
query {
  user(id: $id) {
    field1
    field2
  }
}
```
```js
proj = {
  _id: 0,
  mongoA: 1,
}
```

## License

MIT
