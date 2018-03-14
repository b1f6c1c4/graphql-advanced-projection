const _ = require('lodash');

module.exports = (def) => {
  if (def === undefined) {
    return {};
  }
  if (def === null) {
    return { query: null };
  }
  if (def === true) {
    return { query: null, recursive: true };
  }
  if (_.isString(def)) {
    if (def.endsWith('.')) {
      return {
        query: null,
        select: def.substr(0, def.length - 1),
        recursive: true,
        prefix: def,
      };
    }
    return {
      query: def,
      select: def,
    };
  }
  if (_.isArray(def)) {
    return {
      query: def,
    };
  }
  return {
    query: def.query,
    select: def.select,
    recursive: !!def.recursive,
    prefix: def.prefix,
  };
};
