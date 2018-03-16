const _ = require('lodash/fp');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { prepareConfig } = require('../src/prepareConfig');
const { makePipeline, genPipeline } = require('../src/pipeline');

describe('makePipeline', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const pick = _.mapValues(_.constant)(config);
    const go = (info) => {
      try {
        const proj = makePipeline({ root: { _id: 0 }, pick })(info);
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
      project: { field1: 1 },
      lookup: [],
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
      project: { 'wrap.value': 1 },
      lookup: [],
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
      project: {
        'wrap.field2': 1,
      },
      lookup: [],
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
      project: {
        'wrap.evil': 1,
        'wrap.evils': 1,
        'wrap.field2.f1': 1,
      },
      lookup: [],
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
      project: {
        'evil.wrap.type': 1,
        'evil.wrap.value': 1,
        'evil.wrap.wrap2.value2': 1,
      },
      lookup: [],
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
              from: 'ff',
              localField: 'lf',
              foreignField: 'ff',
              as: 'aa',
            },
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      project: {
        'wrap.q': 1,
        'wrap.lf': 1,
      },
      lookup: [{
        from: 'ff',
        let: { v1: '$wrap.lf' },
        pipeline: [
          { $match: { ff: '$$v1' } },
          { $project: { _id: 0, f1: 1 } },
        ],
        as: 'aa',
      }],
    });
  });

  it('should lookup simple legacy', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: 'q',
            reference: {
              from: 'ff',
              localField: 'lf',
              foreignField: 'ff',
              as: 'aa',
              legacy: true,
            },
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      project: {
        'wrap.q': 1,
        'wrap.lf': 1,
      },
      lookup: [{
        from: 'ff',
        localField: 'wrap.lf',
        foreignField: 'ff',
        as: 'aa',
      }],
    });
  });
});

describe('genPipeline', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (config, query) => new Promise((resolve, reject) => {
    const go = (info) => {
      try {
        const proj = genPipeline(prepareConfig(config));
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
      { $project: { _id: 0, field2: 1 } },
      {
        $lookup: {
          from: 'foos',
          let: { v1: '$field2' },
          pipeline: [
            { $match: { _id: '$$v1' } },
            { $project: { _id: 0, f1: 1 } },
          ],
          as: '__field2__',
        },
      },
    ]);
  });
});
