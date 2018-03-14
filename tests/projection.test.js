const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

const genProjection = require('../src/projection');

describe('genProjection', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const go = (info) => {
      try {
        const proj = genProjection(config);
        resolve(proj(info));
      } catch (e) {
        reject(e);
      }
    };
    graphql(makeExecutableSchema({
      typeDefs,
      resolvers: {
        Query: {
          obj: (parent, args, context, info) => {
            go(info);
          },
          evil: (parent, args, context, info) => {
            go(info);
          },
        },
      },
    }), query).then((res) => {
      if (res.errors) {
        throw res.errors;
      }
    });
  });

  it('should project root', () => {
    expect.hasAssertions();
    return expect(run({ root: { itst: 1 } }, '{ obj { field1 } }')).resolves.toEqual({
      itst: 1,
      field1: 1,
    });
  });

  it('should project simple', () => {
    expect.hasAssertions();
    return expect(run({ Obj: { proj: { field1: 'a' } } }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      a: 1,
    });
  });

  it('should project complex', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: [
        ['othr', { proj: { field1: 'a' } }],
        ['obj', { proj: { field1: 'b' } }],
      ],
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      b: 1,
    });
  });

  it('should project more complex 1', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: { proj: { evil: true } },
      Evil: [
        ['obj', { proj: { field: 'a' } }],
        ['evil', { proj: { field: 'b' } }],
      ],
    }, '{ obj { evil { field } } }')).resolves.toEqual({
      _id: 0,
      'evil.a': 1,
    });
  });

  it('should project more complex 2', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: { proj: { evil: true } },
      Evil: [
        ['obj', { proj: { field: 'a' } }],
        ['evil', { proj: { field: 'b' } }],
      ],
    }, '{ evil { field } }')).resolves.toEqual({
      _id: 0,
      b: 1,
    });
  });
});
