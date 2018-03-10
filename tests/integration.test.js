const _ = require('lodash');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { genResolvers, genProjection } = require('../');

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

const run = (query, proj, user) => graphql(makeExecutableSchema({
  typeDefs,
  resolvers: _.merge(genResolvers(config), {
    Query: {
      user(parent, args, context, info) {
        const actual = project(info);
        expect(actual).toEqual(proj);
        return user;
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
}), query);

describe('User', () => {
  it('userId', async (done) => {
    const user = { _id: 'xx' };
    const result = await run('{ user { userId } }', { _id: 1 }, user);
    expect(result).toEqual({ data: { user: { userId: 'xx' } } });
    done();
  });

  it('a', async (done) => {
    const user = { extra: { a: 'xx' } };
    const result = await run('{ user { a } }', { _id: 0, 'extra.a': 1 }, user);
    expect(result).toEqual({ data: { user: { a: 'xx' } } });
    done();
  });

  it('simple', async (done) => {
    const user = { simple: 123 };
    const result = await run('{ user { simple } }', { _id: 0, simple: 1 }, user);
    expect(result).toEqual({ data: { user: { simple: 123 } } });
    done();
  });

  it('foobar', async (done) => {
    const user = {
      status1: true,
      status2: true,
      items: [
        { type: 'typeA', foobar: 'xx' },
        { type: 'typeB', foobar: 'yy' },
      ],
    };
    const result = await run('{ user { items { foobar } } }', {
      _id: 0,
      status1: 1,
      status2: 1,
      'items.type': 1,
      'items.foobar': 1,
    }, user);
    expect(result).toEqual({ data: { user: { items: [{ foobar: 'xx' }, { foobar: 'yy' }] } } });
    done();
  });

  it('barfoo', async (done) => {
    const user = {
      status1: true,
      status2: true,
      items: [
        { type: 'typeA', barfoo: 'xx' },
        { type: 'typeB' },
      ],
    };
    const result = await run('{ user { items { ... on ItemA { barfoo } } } }', {
      _id: 0,
      status1: 1,
      status2: 1,
      'items.type': 1,
      'items.barfoo': 1,
    }, user);
    expect(result).toEqual({ data: { user: { items: [{ barfoo: 'xx' }, {}] } } });
    done();
  });

  it('values', async (done) => {
    const user = {
      status1: true,
      status2: true,
      items: [
        { type: 'typeA', data: [1, 2, 3] },
        { type: 'typeB' },
      ],
    };
    const result = await run('{ user { items { ... on ItemA { values } } } }', {
      _id: 0,
      status1: 1,
      status2: 1,
      'items.type': 1,
      'items.data': 1,
    }, user);
    expect(result).toEqual({ data: { user: { items: [{ values: [1, 2, 3] }, {}] } } });
    done();
  });

  it('first', async (done) => {
    const user = {
      status1: true,
      status2: true,
      items: [
        { type: 'typeA', data: [1, 2, 3] },
        { type: 'typeB' },
      ],
    };
    const result = await run('{ user { items { ... on ItemA { first } } } }', {
      _id: 0,
      status1: 1,
      status2: 1,
      'items.type': 1,
      'items.data': 1,
    }, user);
    expect(result).toEqual({ data: { user: { items: [{ first: 1 }, {}] } } });
    done();
  });
});
