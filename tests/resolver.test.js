const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { prepareConfig } = require('../src/prepareConfig');
const { genResolvers } = require('../src/resolver');

describe('genResolvers', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query, { obj, evil }) => graphql(makeExecutableSchema({
    typeDefs,
    resolvers: _.merge(genResolvers(prepareConfig(config)), {
      Query: {
        obj: () => obj,
        evil: () => evil,
      },
    }),
  }), query);

  it('should accept simple', async (done) => {
    const result = await run({
      a: 'evil',
      Obj: {
        proj: {
          field1: 'x',
        },
      },
    }, '{ obj { field1 } }', {
      obj: [{ x: 'xxx' }],
    });
    expect(result).toEqual({ data: { obj: [{ field1: 'xxx' }] } });
    done();
  });

  it('should accept complex 1', async (done) => {
    const result = await run({
      a: 'evil',
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
    done();
  });

  it('should accept complex 2', async (done) => {
    const result = await run({
      a: 'evil',
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
    done();
  });
});
