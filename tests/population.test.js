const _ = require('lodash/fp');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { prepareConfig } = require('../src/prepareConfig');
const { makePopulation, genPopulation } = require('../src/population');

describe('makePopulation', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const pick = _.mapValues(_.constant)(config);
    const go = (info) => {
      try {
        const proj = makePopulation({ root: { _id: 0 }, pick })(info);
        resolve(proj);
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
      resolverValidationOptions: { requireResolversForResolveType: false },
    }), query).then((res) => {
      if (res.errors) {
        throw res.errors;
      }
    });
  });

  it('should project default when not configured', () => {
    expect.hasAssertions();
    return expect(run({}, '{ obj { field1 } }')).resolves.toEqual({
      path: '',
      select: { field1: 1 },
    });
  });

  it('should project query simple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            query: 'value',
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      path: '',
      select: { 'wrap.value': 1 },
    });
  });

  it('should populate not recursive', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: { query: 'field2' },
        },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: { query: 'foo' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      path: '',
      select: {
        'wrap.field2': 1,
      },
      populate: [{
        path: 'wrap.field2',
        select: { _id: 0, 'wrap2.foo': 1 },
      }],
    });
  });

  it('should project recursive', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: ['evil', 'evils'],
            recursive: true,
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      path: '',
      select: {
        'wrap.evil': 1,
        'wrap.evils': 1,
        'wrap.field2.f1': 1,
      },
    });
  });

  it('should throw not recursive', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: ['evil', 'evils'],
            recursive: false,
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).rejects.toBeInstanceOf(Error);
  });

  it('should project deep inline fragment with typeCondition', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field3: {
            query: null,
            recursive: true,
            prefix: 'evil.',
          },
        },
      },
      Father: {
        prefix: 'wrap.',
        typeProj: 'type',
        proj: {
          g0: { query: 'value' },
        },
      },
      Child: {
        prefix: 'wrap2.',
        proj: {
          g1: { query: 'value2' },
        },
      },
    }, `{
  obj {
    field3 {
      g0
      ... on Child {
        ... {
          ... on Child {
            g1
          }
        }
      }
    }
  }
}`)).resolves.toEqual({
      path: '',
      select: {
        'evil.wrap.type': 1,
        'evil.wrap.value': 1,
        'evil.wrap.wrap2.value2': 1,
      },
    });
  });

  it('should lookup simple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: 'q',
          },
          field3: {
            query: 'p',
          },
        },
      },
      Father: {
        prefix: 'fthr.',
        proj: {
          g0: {
            query: 'tt',
          },
        },
      },
    }, '{ obj { field1 field2 { f1 } field3 { g0 } } }')).resolves.toEqual({
      path: '',
      select: {
        'wrap.field1': 1,
        'wrap.q': 1,
        'wrap.p': 1,
      },
      populate: [{
        path: 'wrap.q',
        select: { _id: 0, f1: 1 },
      }, {
        path: 'wrap.p',
        select: { _id: 0, 'fthr.tt': 1 },
      }],
    });
  });

  it('should lookup evil', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: 'wrap.',
        proj: {
          self: {
            query: 'q',
          },
        },
      },
    }, '{ evil { self { self { field } } } }')).resolves.toEqual({
      path: '',
      select: {
        'wrap.q': 1,
      },
      populate: [{
        path: 'wrap.q',
        select: { _id: 0, 'wrap.q': 1 },
        populate: [{
          path: 'wrap.q',
          select: { _id: 0, 'wrap.field': 1 },
        }],
      }],
    });
  });
});

describe('genPopulation', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const go = (info) => {
      try {
        const proj = genPopulation(prepareConfig(config));
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
      resolverValidationOptions: { requireResolversForResolveType: false },
    }), query).then((res) => {
      if (res.errors) {
        throw res.errors;
      }
    });
  });

  it('should project simple', () => {
    expect.hasAssertions();
    return expect(run({ root: { _id: 0 }, Obj: { proj: { field1: 'a' } } }, '{ obj { field1 } }')).resolves.toEqual({
      path: '',
      select: { _id: 0, a: 1 },
    });
  });

  it('should lookup simple', () => {
    expect.hasAssertions();
    return expect(run({
      root: { _id: 0 },
      Obj: {
        proj: {
          field2: { query: 'xx' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      path: '',
      select: { _id: 0, xx: 1 },
      populate: [{
        path: 'xx',
        select: { _id: 0, f1: 1 },
      }],
    });
  });
});
