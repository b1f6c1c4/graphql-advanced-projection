const validate = require('../src/validate');

describe('validate', () => {
  it('should accept undefined', () => {
    const result = validate(undefined);
    expect(result.query).toEqual(undefined);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept null', () => {
    const result = validate(null);
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept true', () => {
    const result = validate(true);
    expect(result.query).toEqual(null);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept string', () => {
    const result = validate('str');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept recursive string', () => {
    const result = validate('str.');
    expect(result.query).toEqual(null);
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeTruthy();
    expect(result.prefix).toEqual('str.');
  });

  it('should accept recursive string', () => {
    const result = validate('str');
    expect(result.query).toEqual('str');
    expect(result.select).toEqual('str');
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept array', () => {
    const result = validate(['a', 'b']);
    expect(result.query).toEqual(['a', 'b']);
    expect(result.select).toEqual(undefined);
    expect(result.recursive).toBeFalsy();
    expect(result.prefix).toBeUndefined();
  });

  it('should accept object 1', () => {
    const result = validate({
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
    const result = validate({
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
