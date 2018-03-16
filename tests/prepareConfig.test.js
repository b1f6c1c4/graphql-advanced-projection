const {
  preparePipelineConfig,
  prepareProjectionConfig,
  prepareSchemaConfig,
  prepareConfig,
} = require('../src/prepareConfig');

describe('preparePipelineConfig', () => {
  it('should accept undefiend', () => {
    const result = preparePipelineConfig(undefined, 'fn', 'qu');
    expect(result).toBeUndefined();
  });

  it('should throw no localField no query', () => {
    expect(() => preparePipelineConfig('xx', 'fn', null)).toThrow();
  });

  it('should accept string', () => {
    const result = preparePipelineConfig('xx', 'fn', 'qu');
    expect(result.from).toEqual('xx');
    expect(result.localField).toEqual('qu');
    expect(result.foreignField).toEqual('_id');
    expect(result.as).toEqual('__fn__');
  });

  it('should accept object 1', () => {
    const result = preparePipelineConfig({ foreignField: 'ff', as: 'sa' }, 'fn', 'qu');
    expect(result.from).toEqual('fn');
    expect(result.localField).toEqual('qu');
    expect(result.foreignField).toEqual('ff');
    expect(result.as).toEqual('sa');
  });

  it('should accept object 2', () => {
    const result = preparePipelineConfig({ from: 'a', localField: 'lf' }, 'fn', 'qu');
    expect(result.from).toEqual('a');
    expect(result.localField).toEqual('lf');
    expect(result.foreignField).toEqual('_id');
    expect(result.as).toEqual('__fn__');
  });
});

describe('prepareProjectionConfig', () => {
  it('should accept undefined', () => {
    const result = prepareProjectionConfig(undefined, 'fn');
    expect(result.query).toEqual('fn');
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept null', () => {
    const result = prepareProjectionConfig(null, 'fn');
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept true', () => {
    const result = prepareProjectionConfig(true, 'fn');
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept string', () => {
    const result = prepareProjectionConfig('str', 'fn');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept recursive string', () => {
    const result = prepareProjectionConfig('str.', 'fn');
    expect(result.query).toEqual(null);
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toEqual('str.');
  });

  it('should accept recursive string', () => {
    const result = prepareProjectionConfig('str', 'fn');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept array', () => {
    const result = prepareProjectionConfig(['a', 'b'], 'fn');
    expect(result.query).toEqual(['a', 'b']);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept object 1', () => {
    const result = prepareProjectionConfig({
      query: 'q',
      select: 's',
      recursive: 0,
    }, 'fn');
    expect(result.query).toEqual('q');
    expect(result.select).toEqual('s');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept object 2', () => {
    const result = prepareProjectionConfig({
      query: ['a', 'b'],
      recursive: true,
      prefix: 'xxx',
    }, 'fn');
    expect(result.query).toEqual(['a', 'b']);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toEqual('xxx');
  });

  it('should accept object 3', () => {
    const result = prepareProjectionConfig({
      recursive: true,
    }, 'fn');
    expect(result.query).toEqual('fn');
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept object 4', () => {
    const result = prepareProjectionConfig({
      reference: { as: 'xxxx' },
    }, 'fn');
    expect(result.query).toEqual('fn');
    expect(result.select).toEqual('xxxx');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
    expect(result.reference.from).toEqual('fn');
    expect(result.reference.localField).toEqual('fn');
  });

  it('should accept object 5', () => {
    const result = prepareProjectionConfig({
      query: 'q',
      reference: { },
    }, 'fn');
    expect(result.query).toEqual('q');
    expect(result.select).toEqual('__fn__');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
    expect(result.reference.from).toEqual('fn');
    expect(result.reference.localField).toEqual('q');
  });

  it('should throw select and ref', () => {
    expect(() => prepareProjectionConfig({ select: 'x', reference: 'xxx' }, 'fn')).toThrow();
  });
});

describe('prepareSchemaConfig', () => {
  it('should accept object', () => {
    expect(prepareSchemaConfig({ obj: true })).toEqual({ obj: true });
  });

  it('should accept missing', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(prepareSchemaConfig([[, { k: 1 }]])).toEqual([
      [[[null]], { k: 1 }],
    ]);
  });

  it('should accept undefined', () => {
    expect(prepareSchemaConfig([[undefined, { k: 1 }]])).toEqual([
      [[[null]], { k: 1 }],
    ]);
  });

  it('should accept null', () => {
    expect(prepareSchemaConfig([[null, { k: 1 }]])).toEqual([
      [[], { k: 1 }],
    ]);
  });

  it('should accept string', () => {
    expect(prepareSchemaConfig([['aa', { k: 1 }]])).toEqual([
      [[['aa', null]], { k: 1 }],
    ]);
  });

  it('should accept array', () => {
    expect(prepareSchemaConfig([[['a', 'b'], { k: 1 }]])).toEqual([
      [[['a', 'b']], { k: 1 }],
    ]);
  });

  it('should accept regular', () => {
    expect(prepareSchemaConfig([[[['c']], { k: 1 }]])).toEqual([
      [[['c']], { k: 1 }],
    ]);
  });

  it('should throw wrong', () => {
    expect(() => prepareSchemaConfig([[{}, {}]])).toThrow();
  });
});

describe('prepareConfig', () => {
  it('should handle undefined', () => {
    const { root, config, pick } = prepareConfig();
    expect(root).toEqual({ _id: 0 });
    expect(config).toEqual({});
    expect(pick).toEqual({});
  });

  it('should handle simple', () => {
    const { root, config, pick } = prepareConfig({
      root: {},
      Obj: {
        prefix: 'x',
        proj: {
          a: 'b',
          c: {},
        },
      },
    });
    expect(root).toEqual({});
    expect(config).toEqual({
      Obj: {
        prefix: 'x',
        proj: {
          a: {
            query: 'b',
            select: 'b',
          },
          c: {
            query: 'c',
          },
        },
      },
    });
    expect(pick.Obj({})).toEqual({
      prefix: 'x',
      proj: {
        a: { query: 'b', select: 'b' },
        c: { query: 'c' },
      },
    });
  });

  it('should handle complex', () => {
    const { root, config, pick } = prepareConfig({
      root: {},
      Obj: [['oo', {
        prefix: 'x',
        proj: {
          a: 'b',
          c: {},
        },
      }]],
    });
    expect(root).toEqual({});
    expect(config).toEqual({
      Obj: [[[['oo', null]], {
        prefix: 'x',
        proj: {
          a: {
            query: 'b',
            select: 'b',
          },
          c: {
            query: 'c',
          },
        },
      }]],
    });
    expect(pick.Obj({ path: { key: 'oo' } })).toEqual({
      prefix: 'x',
      proj: {
        a: { query: 'b', select: 'b' },
        c: { query: 'c' },
      },
    });
  });
});
