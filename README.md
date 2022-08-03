# graphql-advanced-projection

[![npm](https://img.shields.io/npm/v/graphql-advanced-projection.svg?style=flat-square)](https://www.npmjs.com/package/graphql-advanced-projection)
[![npm](https://img.shields.io/npm/dt/graphql-advanced-projection.svg?style=flat-square)](https://www.npmjs.com/package/graphql-advanced-projection)
[![GitHub last commit](https://img.shields.io/github/last-commit/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://github.com/b1f6c1c4/graphql-advanced-projection)
[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://github.com/b1f6c1c4/graphql-advanced-projection)
[![license](https://img.shields.io/github/license/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://github.com/b1f6c1c4/graphql-advanced-projection/blob/master/LICENSE.md)

[![Travis](https://img.shields.io/travis/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://travis-ci.org/b1f6c1c4/graphql-advanced-projection)
[![Coveralls](https://img.shields.io/coveralls/github/b1f6c1c4/graphql-advanced-projection.svg?style=flat-square)](https://coveralls.io/github/b1f6c1c4/graphql-advanced-projection)
[![Greenkeeper badge](https://img.shields.io/badge/Greenkeeper-enabled-brightgreen.svg?style=flat-square)](https://greenkeeper.io/)
[![Badges](https://img.shields.io/badge/badges-9%2F9-ff6799.svg?style=flat-square)](https://shields.io/)
<!-- [![Greenkeeper badge](https://badges.greenkeeper.io/b1f6c1c4/graphql-advanced-projection.svg)](https://greenkeeper.io/) -->

> Fully customizable Mongoose/MongoDB projection generator.

## Why

We already have [graphql-projection](https://github.com/bharley/graphql-projection), [graphql-mongodb-projection](https://github.com/du5rte/graphql-mongodb-projection), [graphql-db-projection](https://github.com/markshapiro/graphql-db-projection), and [graphql-fields-projection](https://github.com/Impact-Technical-Resources/graphql-fields-projection).
But `graphql-advanced-projection` is different from all of them above in the following ways:
* **Separete graphql schema and mongodb projection config.** This helps you decouple schema and mongodb into two parts, each of them may change independently. Write graphql in `.graphql`, write config in javascript or `.json`.
* **Easy customization.** No more `gqlField: { type: new GraphQLNonNull(GraphQLInt), projection: 'mongoField' }`. Simply `gqlField: 'mongoField'`.
* **We create resolvers.** `gqlField: (parent) => parent.mongoField` can be automatically generated, even complicated ones like `first: (parent) => parent.items.data[0].value`.
* **Fully supports interfaces, fragments, and inline fragments.** Write `typeProj: 'type'` and `switch (parent.type)` in `__resolveType`.

## Installation

```sh
$ npm i graphql-advanced-projection
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
const { project, resolvers } = gqlProjection({
  User: {
    proj: {
      userId: '_id',
      field1: 'mongoA',
      field2: null,
    },
  },
});
```

### Combine everything together

```js
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
  resolverValidationOptions: { requireResolversForResolveType: false },
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
