const genResolvers = require('../src/resolvers');

describe('genResolver', () => {
  it('should accept empty', () => {
    expect(genResolvers({})).toEqual({});
  });

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
