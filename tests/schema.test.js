const {
  unwindPath,
  normalize,
  matchSchema,
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

describe('normalize', () => {
  it('should accept object', () => {
    expect(normalize({ obj: true })).toEqual([[{}, { obj: true }]]);
  });

  it('should accept missing', () => {
    expect(normalize([[, { k: 1 }]])).toEqual([
      [[[null]], { k: 1 }],
    ]);
  });

  it('should accept undefined', () => {
    expect(normalize([[undefined, { k: 1 }]])).toEqual([
      [[[null]], { k: 1 }],
    ]);
  });

  it('should accept null', () => {
    expect(normalize([[null, { k: 1 }]])).toEqual([
      [[], { k: 1 }],
    ]);
  });

  it('should accept string', () => {
    expect(normalize([['aa', { k: 1 }]])).toEqual([
      [[['aa', null]], { k: 1 }],
    ]);
  });

  it('should accept array', () => {
    expect(normalize([[['a', 'b'], { k: 1 }]])).toEqual([
      [[['a', 'b']], { k: 1 }],
    ]);
  });

  it('should accept regular', () => {
    expect(normalize([[[['c']], { k: 1 }]])).toEqual([
      [[['c']], { k: 1 }],
    ]);
  });
});
