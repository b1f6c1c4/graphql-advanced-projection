# Terms

## Path
A dot-separated string that is to be projected. Used by [Lodash](https://lodash.com/docs/4.17.21#get) and [MongoDB](https://docs.mongodb.com/manual/core/document/#document-dot-notation).

Example:
- `'_id'` - the most common path.
- `'items.0.value'` - get a value in an array.

# Exported functions

The default exported function is `gqlProjection: (config) => { project, populator, resolvers }`:

- `project: (info) => proj`
  - `info` is the 4th argument of a resolver function.
  - `proj` SHOULD be used as [Mongoose projection option](https://mongoosejs.com/docs/api.html#query_Query-select).
  - `proj` is `undefined` if error occured.
- `populator: (info) => popu`
  - `popu` SHOULD be used as [Mongoose population option](http://mongoosejs.com/docs/populate.html#query-conditions).
- `resolvers` is of valid GraphQL resolver format. SHOULD be used with [`graphql-tools/makeExecutableSchema`](https://github.com/apollographql/graphql-tools).

# The config object

All capitalized keys are [Schema config](#schema-config).
Others are global settings, including:

- `root: Object` - Base projection.
  - If undefined, `{ _id: 0 }` will be used.

Example:
```js
{
  root: {}, // global setting
  User: {}, // schema config for GraphQL type User
  TypeA: {}, // schema config for GraphQL type TypeA
}
```

# Schema config

Each GraphQL type corresponds to a schema config, as specified above.
During GraphQL resolution phase, each time such GraphQL type resolves,
a type config corresponds to that GraphQL type is selected.
The type config is further used to create projection, population, and resolvers.

The rule for deciding type config from schema config is as follow.

- If the schema config is an object, then itself is treated as the type config for the GraphQL type in all invocations.
- If the schema config is an array of pairs (each is of a [Match config](#match-config) and a [Type config](#type-config)),
then, for a particular invocation, the first matching pair's type config is used.
  - If none of them matches, type config `{}` is used.
- Otherwise, the schema config is illegal.

## Example for deciding type config out of a schema config

```js
{
  // Use obj as type config for all invocation of GraphQL type User
  // This is the common case and handles 99% use cases.
  User: obj,

  // Use different type configs for different invocation of GraphQL type Item
  // Rarely do we need to distinguish different invocation of the same GraphQL type
  Item: [
    ['x', obj0],                  // Use obj0 when the GraphQL invocation tree starts with x (see below)
    [[['x', null]], obj1],        // Use obj1 when the GraphQL invocation tree starts with x
    [[[null, 'y']], obj2],        // Use obj2 when the GraphQL invocation tree ends with y
    [[[null, 'z', null]], obj3],  // Use obj3 when the GraphQL invocation tree contains z
    [[['']], obj4],               // Use obj4 when the GraphQL invocation tree of length 1
    [[['', '?']], obj4],          // Use obj4 when the GraphQL invocation tree of length <= 2
    [[['x?']], obj1],             // Use obj1 when the GraphQL invocation tree with exactly x or nothing
                                  // Use {} by default
  ],
}
```

## Match config

- If it's undefined or missing, then it's equivalent to `[[null]]`.
- If it's `null`, then it's equivalent to `[]`.
- If it's a string `str`, then it's equivalent to `[[str, null]]`.
- If it's an array of string `arr`, then it's equivalent to `[arr]`.
- Otherwise, it MUST be of `[[null | String]]`:
  - The whole config matches if and only if at least one `[null | String]` matches the path.
  - `null` can match zero, one, or more path items.
  - `''` can match one path item (not numeric) and following numeric keys.
  - `'?'` can match nothing or (one path item (not numeric) and following numeric keys).
  - A string with suffix `'?'` can match nothing or (one path item (exactly match its key) and following numeric keys).
  - Otherwise, a string can match one path item (exactly match its key) and following numeric keys.

# Type config

A type config is an object with the following keys (all optional):

- `prefix: Path` - all `Path` projected by the type config object will be _literally_ prefixed with it.
  - If you expect a path separator, add **manually** in `prefix`.
  - If it starts with `'.'`, then previous prefixes are cleared.
- `typeProj: Path | [Path]` - always project Path(s) when the type is inquired. This SHOULD be used to retrieve the type information.
- `proj: Object` - project Path(s) based on what the client asks for.
  - Each key MUST match a GraphQL field of the type.
  - The corresponded value MUST be a [Projection config](#projection-config).

Example:
```js
{
  prefix: '', // don't prefix mongodb fields
  typeProj: 'type', // mongodb field(s) that stores type information
  proj: {
    // GraphQL field id corresponds to mongodb field _id, we project and resolve for you
    id: '_id',

    // GraphQL field f1 corresponds to mongodb field f1, GraphQL handles such case very well
    // f1: undefined,

    // GraphQL field f2 (which may contain subfields)
    // corresponds to mongodb field f2 (which stores an array of documents)
    // We project and resolve recursively into sub-documents for you
    f2: true,

    // GraphQL field f3 (which may contain subfields)
    // corresponds to mongodb field sub (which stores an array of documents)
    // We project and resolve recursively into sub-documents for you
    f3: 'sub.',

    // GraphQL field f4 is not stored in mongodb at all
    // You SHOULD write your own resolver for this
    f4: null,

    // GraphQL field f5 corresponds to mongodb field cus
    // You want customize the resolver part but leave the projection part untouched.
    // You SHOULD write your own resolver for this
    // Note: this is useful for you to make additional db queries to get referenced documents!
    f5: { query: 'cus' },
  },
}
```

## Projection config

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
  - `recursive: Boolean` - (default `false`) Project the fields of the return type altogether. For `genProjection`, SHOULD be used with `query: null`; for `genPopulation`, MUST be used with `query: string`.
    - It SHOULD be `true` if a single MongoDB query can get all the information.
    - It SHOULD be `false` if a separate query is needed to obtain extra information.
  - `prefix: null | Path` - (ignored except `recursive: true`) Each `Path` projected by the return type is _literally_ prefixed by it.
    - If undefined, prefix the field name and `'.'`.
    - If `null`, don't prefix.
    - If it starts with `'.'`, then previous prefixes (include `prefix` in the type config) are cleared.
    - Note: path separator `'.'` will _not_ be appended automatically. Append it manually if you need.

