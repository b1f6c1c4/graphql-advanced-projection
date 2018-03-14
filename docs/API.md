# Terms

## Path
A dot-separated string that is to be projected. Used by [Lodash](https://lodash.com/docs/4.17.5#get) and [MongoDB](https://docs.mongodb.com/manual/core/document/#document-dot-notation).

Example:
- `'_id'` - the most common path.
- `'items.0.value'` - get a value in an array.

# Exported functions
- `genProjection: (config) => (info) => result`
  - `info` is the 4th argument of a resolver function.
  - `result` is undefined if error occured.
  - `result` is an object with Path as keys and `1` or `0` as value.
  - `result._id` always exists.
- `genResolvers: (config) => resolvers`
  - `resolvers` is of valid GraphQL resolver format. SHOULD be used with [`graphql-tools/makeExecutableSchema`](https://github.com/apollographql/graphql-tools).

# Config object

If a key starts with capital character, it corresponds to a GraphQL type and the value MUST be a [type config](type-config-object).
Otherwise, it's considered [global settings](global-settings).

Example:
```js
{
  User: { /* type config for GraphQL type User */ },
  TypeA: { /* type config for GraphQL type TypeA */ },
}
```

# Type config object

It MAY contain the following keys:
- `prefix: Path` - every other `Path` in the partial config object is regarded as `(p) => prefix + p`. If you expect a path separator, add **manually** in `prefix`.
  - If it starts with `'.'`, then it's a relative prefix.
- `typeProj: Path | [Path]` - always project Path(s) when the type is inquired. This SHOULD be used to retrieve the type information.
- `proj: Object` - project Path(s) based on what the client asks for.
  - Each key MUST match a GraphQL field of the type.
  - The corresponded value MUST be a [Projection config](projection-config).

Example:
```js
{
  prefix: 'items.',
  typeProj: 'type',
  proj: {
    id: /* projection config */ '_id',
    value: /* projection config */ { query: 'value' },
  },
}
```

# Projection config

- If it's `undefined`, then it's equivalent to `{}`.
- If it's `null`, then it's equivalent to `{ query: null }`.
- If it's `true`, then it's equivalent to `{ query: null, recursive: true }`.
- If it's a string `str`, then it's equivalent to `{ query: str, select: str }`.
- If it's an array `arr`, then it's equivalent to `{ query: arr }`.
- Otherwise, it MUST be an object and MAY contain the following keys:
  - `query: null | Path | [Path]` - Path(s) to project when the field is inquired.
    - If undefined, project the field name.
    - If `null`, project nothing.
  - `select: undefined | Path` - Generate a resolver for the type that maps the Path to the field.
    - If undefined, don't generate.
  - `recursive: Boolean` - (default `false`) project the fields of the return type altogether.
    - It SHOULD be `true` if a single MongoDB query can get all the information.
    - It SHOULD be `false` if a separate query is needed to obtain extra information.

Example:
```js
fieldA: undefined, // Project 'fieldA' and resolve by it
fieldA: 'mongoA', // Project 'mongoA' and resolve by it
fieldA: null, // Do not project nor resolve
fieldA: true, // Project the return type of fieldA but don't resolve automatically
fieldA: { query: 'mongoA', select: 'mongoB' }, // Project 'mongoA' and resolve by 'mongoB'
fieldA: { query: 'mongoA' }, // Project 'mongoA' but don't resolve automatically
fieldA: { query: null, select: 'mongoB' }, // Do not project but resolve by 'mongoB'
fieldA: { select: 'mongoB' }, // Project 'fieldA' but resolve by 'mongoB'
// The following are valid yet unuseful.
fieldA: { recursive: true }, // Project 'fieldA' and the return type of fieldA but don't resolve automatically
fieldA: { query: 'mongoA', recursive: true }, // Project 'mongoA' and the return type of fieldA
fieldA: { select: 'mongoA', recursive: true }, // Project the return type of fieldA and resolve by 'mongoA'
```

# Global settings

Currently, no global setting is used.
