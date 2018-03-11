const validate = require('../src/validate');

describe('validate', () => {
  it('should accept undefined', () => {
    const { query, select, recursive } = validate(undefined);
    expect(query).toEqual(undefined);
    expect(select).toEqual(undefined);
    expect(recursive).toBeFalsy();
  });

  it('should accept null', () => {
    const { query, select, recursive } = validate(null);
    expect(query).toEqual(null);
    expect(select).toEqual(undefined);
    expect(recursive).toBeFalsy();
  });

  it('should accept string', () => {
    const { query, select, recursive } = validate('str');
    expect(query).toEqual('str');
    expect(select).toEqual('str');
    expect(recursive).toBeFalsy();
  });

  it('should accept array', () => {
    const { query, select, recursive } = validate(['a', 'b']);
    expect(query).toEqual(['a', 'b']);
    expect(select).toEqual(undefined);
    expect(recursive).toBeFalsy();
  });

  it('should accept object 1', () => {
    const { query, select, recursive } = validate({
      query: 'q',
      select: 's',
      recursive: 0,
    });
    expect(query).toEqual('q');
    expect(select).toEqual('s');
    expect(recursive).toBeFalsy();
  });

  it('should accept object 2', () => {
    const { query, select, recursive } = validate({
      query: ['a', 'b'],
      recursive: true,
    });
    expect(query).toEqual(['a', 'b']);
    expect(select).toEqual(undefined);
    expect(recursive).toBeTruthy();
  });
});
