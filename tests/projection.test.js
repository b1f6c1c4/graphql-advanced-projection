const genProjection = require('../src/projection');
const fs = require('fs');
const path = require('path');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

describe('genProjection', () => {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

  const run = (cfg, query) => new Promise((resolve) => {
    graphql(makeExecutableSchema({
      typeDefs,
      resolvers: {
        Query: {
          obj: (parent, args, context, info) => {
            resolve(genProjection(cfg)(info));
          },
          evil: (parent, args, context, info) => {
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

  it('should project ignore', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field1: null,
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
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
      'wrap.field1': 1,
    });
  });

  it('should project object null', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            query: null,
            select: 'x',
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
    });
  });

  it('should not project nested if unset', () => {
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
      'wrap.field2': 1,
    });
  });

  it('should project nested', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: true,
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
      Obj: {
        proj: {
          field3: true,
        },
      },
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
      Obj: {
        proj: {
          field3: true,
        },
      },
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
      Obj: {
        proj: {
          field3: true,
        },
      },
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

  it('should handle deep nested', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        proj: {
          self: true,
        },
      },
    }, `{
  evil {
    field
    self {
      field
      self {
        field
      }
    }
  }
}
`)).resolves.toEqual({
      _id: 0,
      field: 1,
    });
  });

  it('should handle deep nested prefix', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: 'x.',
        proj: {
          self: true,
        },
      },
    }, `{
  evil {
    field
    self {
      field
      self {
        field
      }
    }
  }
}
`)).resolves.toEqual({
      _id: 0,
      'x.field': 1,
    });
  });

  it('should handle deep nested prefix relative', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: '.x.',
        proj: {
          self: true,
        },
      },
    }, `{
  evil {
    field
    self {
      field
      self {
        field
      }
    }
  }
}
`)).resolves.toEqual({
      _id: 0,
      'x.field': 1,
      'x.x.field': 1,
      'x.x.x.field': 1,
    });
  });
});
