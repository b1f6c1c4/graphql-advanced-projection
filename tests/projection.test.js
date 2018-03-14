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

  it('should return undefined if error', () => {
    expect.hasAssertions();
    const evil = {
      get Obj() {
        throw new Error();
      },
    };
    return expect(run(evil, '{ obj { field1 } }')).resolves.toBeUndefined();
  });

  it('should project default when not configured', () => {
    expect.hasAssertions();
    return expect(run({}, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      field1: 1,
    });
  });

  it('should project query undefined', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {},
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.field1': 1,
    });
  });

  it('should project query null', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field1: {
            query: null,
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
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
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project query multiple', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: {
            query: ['value', 'value2'],
          },
        },
      },
    }, '{ obj { field1 } }')).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
      'wrap.value2': 1,
    });
  });

  it('should not project recursive if false', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: { },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: { query: 'foo' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.field2': 1,
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
      _id: 0,
      'wrap.evil': 1,
      'wrap.evils': 1,
      'wrap.field2.f1': 1,
    });
  });

  it('should project recursive prefix null', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: ['evil', 'evils'],
            recursive: true,
            prefix: null,
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.evil': 1,
      'wrap.evils': 1,
      'wrap.f1': 1,
    });
  });

  it('should project recursive prefix', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: ['evil', 'evils'],
            recursive: true,
            prefix: 'xxx.',
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.evil': 1,
      'wrap.evils': 1,
      'wrap.xxx.f1': 1,
    });
  });

  it('should project recursive prefix absolute', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: null,
            recursive: true,
            prefix: '.xxx.',
          },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'xxx.f1': 1,
    });
  });

  it('should project recursive relative', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: null,
            recursive: true,
            prefix: 'xxx.',
          },
        },
      },
      Foo: {
        prefix: 'wrap2.',
        proj: {
          f1: { query: 'foo' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap.xxx.wrap2.foo': 1,
    });
  });

  it('should project recursive absolute', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field2: {
            query: null,
            recursive: true,
            prefix: 'xxx.',
          },
        },
      },
      Foo: {
        prefix: '.wrap2.',
        proj: {
          f1: { query: 'foo' },
        },
      },
    }, '{ obj { field2 { f1 } } }')).resolves.toEqual({
      _id: 0,
      'wrap2.foo': 1,
    });
  });

  it('should project inline fragment', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: { query: 'value' },
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

  it('should project deep inline fragment', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: { query: 'value' },
        },
      },
    }, `{
  obj {
    ... {
      ... {
        ... {
          field1
        }
      }
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
          field1: { query: 'value' },
        },
      },
    }, `{
  obj {
    ...f
  }
}
fragment f on Obj {
  field1
}
`)).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project deep fragment', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        prefix: 'wrap.',
        proj: {
          field1: { query: 'value' },
        },
      },
    }, `{
  obj {
    ...f
  }
}
fragment f on Obj {
  ...g
}
fragment g on Obj {
  ...h
}
fragment h on Obj {
  field1
}
`)).resolves.toEqual({
      _id: 0,
      'wrap.value': 1,
    });
  });

  it('should project typeProj', () => {
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
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'evil.wrap.type': 1,
      'evil.wrap.value': 1,
    });
  });

  it('should project inline fragment with typeCondition', () => {
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
        g1
      }
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'evil.wrap.type': 1,
      'evil.wrap.value': 1,
      'evil.wrap.wrap2.value2': 1,
    });
  });

  it('should project inline fragment with typeCondition partial', () => {
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
      ... on Child {
        g0
        g1
      }
    }
  }
}`)).resolves.toEqual({
      _id: 0,
      'evil.wrap.type': 1,
      'evil.wrap.wrap2.g0': 1,
      'evil.wrap.wrap2.value2': 1,
    });
  });

  it('should project fragment with typeCondition', () => {
    expect.hasAssertions();
    return expect(run({
      Obj: {
        proj: {
          field3: {
            query: null,
            recursive: true,
            prefix: null,
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
      ...f
    }
  }
}
fragment f on Child {
  g1
}
`)).resolves.toEqual({
      _id: 0,
      'wrap.type': 1,
      'wrap.value': 1,
      'wrap.wrap2.value2': 1,
    });
  });

  it('should handle deep nested', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: null,
          },
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
        prefix: '.x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: null,
          },
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
        prefix: 'x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: null,
          },
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

  it('should handle deep nested proj prefix', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: 'y.',
          },
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
      'y.field': 1,
      'y.y.field': 1,
    });
  });

  it('should handle deep nested proj prefix prefix', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: '.x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: 'y.',
          },
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

  it('should handle deep nested proj prefix prefix relative', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: 'x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: 'y.',
          },
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
      'x.y.x.field': 1,
      'x.y.x.y.x.field': 1,
    });
  });

  it('should handle deep nested proj prefix abs', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: '.y.',
          },
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
      'y.field': 1,
    });
  });

  it('should handle deep nested proj prefix abs prefix', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: '.x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: '.y.',
          },
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

  it('should handle deep nested proj prefix abs prefix relative', () => {
    expect.hasAssertions();
    return expect(run({
      Evil: {
        prefix: 'x.',
        proj: {
          self: {
            query: null,
            recursive: true,
            prefix: '.y.',
          },
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
      'y.x.field': 1,
    });
  });
});
