const {
  prepareProjectionConfig,
  prepareSchemaConfig,
  prepareConfig,
} = require('../src/prepareConfig');

describe('prepareProjectionConfig', () => {
  it('should accept undefined', () => {
    const result = prepareProjectionConfig(undefined);
    expect(result.query).toEqual(undefined);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept null', () => {
    const result = prepareProjectionConfig(null);
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept true', () => {
    const result = prepareProjectionConfig(true);
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept string', () => {
    const result = prepareProjectionConfig('str');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept recursive string', () => {
    const result = prepareProjectionConfig('str.');
    expect(result.query).toEqual(null);
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toEqual('str.');
  });

  it('should accept recursive string', () => {
    const result = prepareProjectionConfig('str');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept array', () => {
    const result = prepareProjectionConfig(['a', 'b']);
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
    });
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
    });
    expect(result.query).toEqual(['a', 'b']);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toEqual('xxx');
  });
});

describe('prepareSchemaConfig', () => {
  it('should accept object', () => {
    expect(prepareSchemaConfig({ obj: true })).toEqual([[[[null]], { obj: true }]]);
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
    expect(config).toEqual({ root: { _id: 0 } });
    expect(pick).toEqual({});
  });

  it('should handle simple', () => {
    const { root, config, pick } = prepareConfig({
      root: {},
      Obj: {
        prefix: 'x',
        proj: {
          a: 'b',
        },
      },
    });
    expect(root).toEqual({});
    expect(config).toEqual({
      root: {},
      Obj: [
        [[[null]], {
          prefix: 'x',
          proj: {
            a: 'b',
          },
        }],
      ],
    });
    expect(pick.Obj({})).toEqual({
      prefix: 'x',
      proj: {
        a: { query: 'b', select: 'b' },
      },
    });
  });
});
