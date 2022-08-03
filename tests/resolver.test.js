const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { prepareConfig } = require('../src/prepareConfig');
const { genResolvers } = require('../src/resolver');

describe('genResolvers', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, source, { obj, evil }) => graphql({
    schema: makeExecutableSchema({
      typeDefs,
      resolvers: _.merge(genResolvers(prepareConfig(config)), {
        Query: {
          obj: () => obj,
          evil: () => evil,
        },
      }),
      resolverValidationOptions: { requireResolversForResolveType: false },
    }),
    source,
  });

  it('should accept simple', async () => {
    const result = await run({
      Obj: {
        proj: {
          field1: 'x',
        },
      },
    }, '{ obj { field1 } }', {
      obj: [{ x: 'xxx' }],
    });
    expect(result).toEqual({ data: { obj: [{ field1: 'xxx' }] } });
  });

  it('should accept complex 1', async () => {
    const result = await run({
      Evil: [
        ['obj', {
          proj: {
            field: 'x',
          },
        }],
        ['evil', {
          proj: {
            field: 'y',
          },
        }],
      ],
    }, '{ obj { evil { field } } }', {
      obj: [{ evil: { x: 'xxx' } }],
    });
    expect(result).toEqual({ data: { obj: [{ evil: { field: 'xxx' } }] } });
  });

  it('should accept complex 2', async () => {
    const result = await run({
      Evil: [
        ['obj', {
          proj: {
            field: 'x',
          },
        }],
        ['evil', {
          proj: {
            field: 'y',
          },
        }],
      ],
    }, '{ evil { field } }', {
      evil: { y: 'xxx' },
    });
    expect(result).toEqual({ data: { evil: { field: 'xxx' } } });
  });

  it('should accept complex 3', async () => {
    const result = await run({
      Evil: [
        ['obj', {
          proj: {
            field: 'x',
          },
        }],
        ['evil', {
          proj: {
            field: null,
          },
        }],
      ],
    }, '{ evil { field } }', {
      evil: { field: 'xxx' },
    });
    expect(result).toEqual({ data: { evil: { field: 'xxx' } } });
  });
});
