const _ = require('lodash');

module.exports = (def) => {
  if (def === undefined) {
    return {};
  }
  if (def === null) {
    return { query: null };
  }
  if (_.isString(def)) {
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
  };
};
