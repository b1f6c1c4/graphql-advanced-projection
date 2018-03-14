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
- `prefix: Path` - each `Path` projected by the type config object is _literally_ prefixed with it.
  - If you expect a path separator, add **manually** in `prefix`.
  - If it starts with `'.'`, then previous prefixes are cleared.
- `typeProj: Path | [Path]` - always project Path(s) when the type is inquired. This SHOULD be used to retrieve the type information.
- `proj: Object` - project Path(s) based on what the client asks for.
  - Each key MUST match a GraphQL field of the type.
  - The corresponded value MUST be a [Projection config](projection-config).

Example:
```js
{
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
- If it's a string:
  - If it matches `/^(?<str>.*)\.$/`, then it's equivalent to `{ query: null, select: str, recursive: true, prefix: str + '.' }`.
  - Otherwise, it's equivalent to `{ query: str, select: str }`.
- If it's an array `arr`, then it's equivalent to `{ query: arr }`.
- Otherwise, it MUST be an object and MAY contain the following keys:
  - `query: null | Path | [Path]` - Path(s) to project when the field is inquired.
    - If undefined, project the field name.
    - If `null`, project nothing.
  - `select: Path` - Generate a resolver for the type that maps the Path to the field.
    - If undefined, don't generate.
    - Note: GraphQL will natively resolve `fieldName: (parent) => parent.fieldName`. Thus if `select` exactly matches the field name, leave it undefined.
  - `recursive: Boolean` - (default `false`) Project the fields of the return type altogether. SHOULD be used with `query: null`.
    - It SHOULD be `true` if a single MongoDB query can get all the information.
    - It SHOULD be `false` if a separate query is needed to obtain extra information.
  - `prefix: null | Path` - (ignored except `recursive: true`) Each `Path` projected by the return type is _literally_ prefixed by it.
    - If undefined, prefix the field name and `'.'`.
    - If `null`, don't prefix.
    - If it starts with `'.'`, then previous prefixes (include `prefix` in the type config) are cleared.
    - Note: path separator `'.'` will _not_ be inserted automatically. Append it manually if you need.

Example:
```js
// You SHOULD NOT create custom resolvers for these.
fieldA: undefined, // Project 'fieldA' and use native resolver
fieldA: true, // Project the return type of fieldA (with prefix 'fieldA.') and use native resolver
fieldA: 'mongoA', // Project 'mongoA' and resolve by it
fieldA: 'mongoA.', // Project the return type of fieldA (with prefix 'mongoA.') and resolve by 'mongoA'
// You SHOULD create custom resolvers for these.
fieldA: null, // Do not project
fieldA: { query: 'mongoA' }, // Project 'mongoA'
```

# Global settings

- `root: Object` - Base projection.
  - If undefined, `{ _id: 0 }` will be used.
