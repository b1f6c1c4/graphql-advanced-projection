const genResolver = require('../src/resolver');

describe('genResolver', () => {
  it('should accept empty', () => {
    expect(genResolver({})).toEqual({});
  });

  it('should accept simple proj', () => {
    expect(genResolver({
      prefix: 'wrap.',
      proj: {
        key: 'value',
      },
    }).key({
      value: 'v',
    })).toEqual('v');
  });

  it('should accept object proj', () => {
    expect(genResolver({
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
    expect(genResolver({
      prefix: 'wrap.',
      proj: {
        key: {
          query: 'fun',
        },
      },
    }).key).toBeUndefined();
  });
});
