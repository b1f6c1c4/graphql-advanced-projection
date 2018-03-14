const _ = require('lodash');

function unwindPath(path) {
  const result = [];
  let p = path;
  while (p) {
    result.unshift(p.key);
    p = p.prev;
  }
  return result;
}

function normalize(config) {
  const norm = (cfg) => {
    if (cfg === undefined) {
      return [[null]];
    }
    if (cfg === null) {
      return [];
    }
    if (_.isString(cfg)) {
      return [[cfg, null]];
    }
    if (!_.isArray(cfg)) {
      throw new Error('Incorrect match config');
    }
    if (cfg.length > 0 && !_.isArray(cfg[0])) {
      return [cfg];
    }
    return cfg;
  };
  if (_.isArray(config)) {
    return config.map(([m, t]) => [norm(m), t]);
  }
  return [[{}, config]];
}

const matchSchema = (cfg) => (path) => {
  // TODO: implement an NFA for this
};

module.exports = {
  unwindPath,
  normalize,
  matchSchema,
};
