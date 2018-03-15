const { prepareSchemaConfig } = require('../src/prepareConfig');
const {
  unwindPath,
  append,
  matchSchema,
  pickType,
} = require('../src/schema');

describe('unwindPath', () => {
  it('should unwind', () => {
    expect(unwindPath({
      prev: {
        prev: undefined,
        key: 'k',
      },
      key: 'k2',
    })).toEqual(['k', 'k2']);
  });
});

describe('append', () => {
  it('should append exist', () => {
    const obj = { a: [1, 2] };
    append(obj, 'a', 3);
    expect(obj.a).toEqual([1, 2, 3]);
  });

  it('should append non-exist', () => {
    const obj = {};
    append(obj, 'a', 3);
    expect(obj.a).toEqual([3]);
  });
});

describe('matchSchema', () => {
  it('should match empty', () => {
    const func = (...args) => matchSchema([])(args);
    expect(func()).toEqual(true);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match simple', () => {
    const func = (...args) => matchSchema(['a'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match null', () => {
    const func = (...args) => matchSchema([null])(args);
    expect(func()).toEqual(true);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(true);
    expect(func(2, 'a')).toEqual(true);
  });

  it('should match null simple', () => {
    const func = (...args) => matchSchema([null, 'b'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match simple null', () => {
    const func = (...args) => matchSchema(['a', null])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match simple dup', () => {
    const func = (...args) => matchSchema(['a', 'a'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match simple simple', () => {
    const func = (...args) => matchSchema(['a', 'b'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match null simple simple', () => {
    const func = (...args) => matchSchema([null, 'a', 'b'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match simple null simple', () => {
    const func = (...args) => matchSchema(['a', null, 'b'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match null null', () => {
    const func = (...args) => matchSchema([null, null])(args);
    expect(func()).toEqual(true);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(true);
    expect(func(2, 'a')).toEqual(true);
  });

  it('should match wrong simple', () => {
    const func = (...args) => matchSchema(['b'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match empty', () => {
    const func = (...args) => matchSchema([''])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match empty empty', () => {
    const func = (...args) => matchSchema(['', ''])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(false);
    expect(func('a', 'b')).toEqual(true);
    expect(func('a', 0, 1)).toEqual(false);
    expect(func('a', 'b', 0, 1)).toEqual(true);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match opt empty', () => {
    const func = (...args) => matchSchema(['?'])(args);
    expect(func()).toEqual(true);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(false);
    expect(func('a', 0, 'a', 1)).toEqual(false);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });

  it('should match opt', () => {
    const func = (...args) => matchSchema(['a?', 'a'])(args);
    expect(func()).toEqual(false);
    expect(func('a')).toEqual(true);
    expect(func('a', 'b')).toEqual(false);
    expect(func('a', 0, 1)).toEqual(true);
    expect(func('a', 'b', 0, 1)).toEqual(false);
    expect(func('a', 'a')).toEqual(true);
    expect(func('a', 0, 'a', 1)).toEqual(true);
    expect(func(2)).toEqual(false);
    expect(func(2, 'a')).toEqual(false);
  });
});

describe('pickType', () => {
  it('should pick object', () => {
    const config = prepareSchemaConfig({ k: 1 });
    expect(pickType(config)()).toEqual(config);
  });

  it('should pick simple', () => {
    const config = prepareSchemaConfig([
      ['a', { k: 1 }],
      ['b', { k: 2 }],
    ]);
    expect(pickType(config)({ path: { key: 'a' } })).toEqual(config[0][1]);
  });

  it('should pick dup', () => {
    const config = prepareSchemaConfig([
      ['a', { k: 1 }],
      ['a', { k: 2 }],
    ]);
    expect(pickType(config)({ path: { key: 'a' } })).toEqual(config[0][1]);
  });

  it('should pick default', () => {
    const config = prepareSchemaConfig([
      ['a', { k: 1 }],
      ['b', { k: 2 }],
    ]);
    expect(pickType(config)({ path: { key: 'c' } })).toEqual({});
  });

  it('should pick either', () => {
    const config = prepareSchemaConfig([
      [[['c'], ['a']], { k: 1 }],
      ['a', { k: 2 }],
    ]);
    expect(pickType(config)({ path: { key: 'a' } })).toEqual(config[0][1]);
  });

  it('should pick empty', () => {
    const config = prepareSchemaConfig([]);
    expect(pickType(config)({ path: { key: 'a' } })).toEqual({});
  });
});
