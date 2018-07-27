const _ = require('lodash/fp');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { prepareConfig } = require('../src/prepareConfig');
const { makeRef, genRef } = require('../src/ref');

describe('makeRef', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const pick = _.mapValues(_.constant)(config);
    const go = (info) => {
      try {
        const proj = makeRef({ root: { _id: 0 }, pick })(info);
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
    }), query).then((res) => {
      if (res.errors) {
        throw res.errors;
      }
    });
  });

  it('should project default when not configured', () => {
    expect.hasAssertions();
    return expect(run({}, '{ obj { field1 } }')).resolves.toEqual({
      '': { field1: 1 },
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
      '': { 'wrap.value': 1 },
    });
  });

  it('should not project recursive if false', () => {
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
      '': {
        'wrap.field2': 1,
      },
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
      '': {
        'wrap.evil': 1,
        'wrap.evils': 1,
        'wrap.field2.f1': 1,
      },
    });
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
      '': {
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
            reference: {
              as: 'aa',
            },
          },
          field3: {
            query: 'p',
            reference: {
              as: 'bb',
            },
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
    }, '{ obj { field2 { f1 } field3 { g0 } } }')).resolves.toEqual({
      '': {
        'wrap.q': 1,
        'wrap.p': 1,
      },
      aa: {
        f1: 1,
      },
      bb: {
        'fthr.tt': 1,
      },
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
            reference: {
              as: 'aa',
            },
          },
        },
      },
    }, '{ evil { self { self { field } } } }')).resolves.toEqual({
      '': {
        'wrap.q': 1,
      },
      aa: {
        'wrap.q': 1,
      },
      'aa.aa': {
        'wrap.field': 1,
      },
    });
  });
});

describe('genRef', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const go = (info) => {
      try {
        const proj = genRef(prepareConfig(config));
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

  it('should project simple', () => {
    expect.hasAssertions();
    return expect(run({ Obj: { proj: { field1: 'a' } } }, '{ obj { field1 } }')).resolves.toEqual([
      { $project: { _id: 0, a: 1 } },
    ]);
  });

  it('should lookup simple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field2: { reference: 'foos' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual([
      {
        $lookup: {
          from: 'foos',
          localField: 'field2',
          foreignField: '_id',
          as: '__field2__',
        },
      },
      { $project: { _id: 0, field2: 1, '__field2__.f1': 1 } },
    ]);
  });

  it('should not lookup id', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field2: { reference: { from: 'foos', foreignField: 'f1' } },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual([
      {
        $project: {
          _id: 0,
          field2: 1,
          __field2__: {
            $map: {
              input: '$field2',
              as: 'id',
              in: { f1: '$$id' },
            },
          },
        },
      },
    ]);
  });

  it('should lookup further', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          evil: {
            query: null,
            reference: {
              from: 'evils',
              localField: 'xevil',
              foreignField: 'field',
            },
          },
        },
      },
      Evil: {
        proj: {
          self: {
            query: null,
            reference: {
              from: 'evils',
              localField: 'xself',
            },
          },
        },
      },
    }, '{ obj { evil { self { field } } } }')).resolves.toEqual([
      {
        $lookup: {
          from: 'evils',
          localField: 'xevil',
          foreignField: 'field',
          as: '__evil__',
        },
      },
      {
        $lookup: {
          from: 'evils',
          localField: '__evil__.xself',
          foreignField: '_id',
          as: '__self__',
        },
      },
      { $project: { _id: 0, '__self__.field': 1 } },
    ]);
  });
});
