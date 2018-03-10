const {
  genResolvers,
  genProjection,
} = require('../projection');

const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

describe('genResolver', () => {
  it('should accept simple proj', () => {
    expect(genResolvers({
      prefix: 'wrap.',
      proj: {
        key: 'value',
      },
    }).key({
      value: 'v',
    })).toEqual('v');
  });

  it('should accept object proj', () => {
    expect(genResolvers({
      prefix: 'wrap.',
      proj: {
        key: {
          query: 'fun',
          select: 'value',
        },
      },
    }).key({
      value: 'v',
    })).toEqual('v');
  });

  it('should accept undefined array proj', () => {
    expect(genResolvers({
      prefix: 'wrap.',
      proj: {
        key: {
          query: 'fun',
        },
      },
    }).key).toBeUndefined();
  });
});

describe('genProjection', () => {
  const typeDefs = `
type Query {
  obj: [Obj!]
}
type Obj {
  field1: String
  field2: Foo
  field3: [Father!]!
}
type Foo {
  f1: String
}
interface Father {
  g0: Int
}
type Child implements Father {
  g0: Int
  g1: String
}
`;
  const run = (cfg, query) => new Promise((resolve) => {
    graphql(makeExecutableSchema({
      typeDefs,
      resolvers: {
        Query: {
          obj: (parent, args, context, info) => {
            resolve(genProjection(cfg)(info));
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
      _id: 0,
      field1: 1,
    });
  });

  it('should project simple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: 'value',
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project multiple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: ['value', 'value2'],
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
      'wrap.value2': 1,
    });
  });

  it('should project object', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            query: 'value',
            select: 'x',
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project object multiple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            query: ['value', 'value2'],
            select: 'x',
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
      'wrap.value2': 1,
    });
  });

  it('should project object undefined', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            select: 'x',
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
    });
  });

  it('should project nested', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: { },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: 'foo',
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap2.foo': 1,
    });
  });

  it('should project nested simple override', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: 'wrap2',
        },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: 'foo',
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.wrap2': 1,
    });
  });

  it('should project nested force override', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: 'wrap2',
          },
        },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: 'foo',
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.wrap2': 1,
    });
  });

  it('should project nested additional override', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: 'wrap2',
            recursive: true,
          },
        },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: 'foo',
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.wrap2': 1,
      'wrap2.foo': 1,
    });
  });

  it('should project inline fragment', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: 'value',
        },
      },
    }, `{
  obj {
    ... {
      field1
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project fragment', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: 'value',
        },
      },
    }, `{
  obj {
    ...f
  }
}
fragment f on Obj {
  field1
}`)).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project typeProj', () => {
    expect.hasAssertions();
    return expect(run({
      Father: {
        prefix: 'wrap.',
        typeProj: 'type',
        proj: {
          g0: 'value',
        },
      },
      Child: {
        prefix: 'wrap2.',
        proj: {
          g1: 'value2',
        },
      },
    }, `{
  obj {
    field3 {
      g0
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'wrap.type': 1,
      'wrap.value': 1,
    });
  });

  it('should project inline fragment with typeCondition', () => {
    expect.hasAssertions();
    return expect(run({
      Father: {
        prefix: 'wrap.',
        typeProj: 'type',
        proj: {
          g0: 'value',
        },
      },
      Child: {
        prefix: 'wrap2.',
        proj: {
          g1: 'value2',
        },
      },
    }, `{
  obj {
    field3 {
      g0
      ... on Child {
        g1
      }
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'wrap.type': 1,
      'wrap.value': 1,
      'wrap2.value2': 1,
    });
  });

  it('should project fragment with typeCondition', () => {
    expect.hasAssertions();
    return expect(run({
      Father: {
        prefix: 'wrap.',
        typeProj: 'type',
        proj: {
          g0: 'value',
        },
      },
      Child: {
        prefix: 'wrap2.',
        proj: {
          g1: 'value2',
        },
      },
    }, `{
  obj {
    field3 {
      g0
      ...f
    }
  }
}
fragment f on Child {
  g1
}`)).resolves.toEqual({
      _id: 0,
      'wrap.type': 1,
      'wrap.value': 1,
      'wrap2.value2': 1,
    });
  });
});
