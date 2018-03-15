const _ = require('lodash/fp');
const { pickType } = require('./schema');
const logger = require('../logger');

function prepareProjectionConfig(def) {
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
}

function prepareSchemaConfig(config) {
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
    return config.map(([m, t]) => [norm(m), _.cloneDeep(t)]);
  }
  return _.cloneDeep(config);
}

function prepareConfig(configs = {}) {
  const root = configs.root || { _id: 0 };
  const ncfgs = _.compose(
    _.mapValues(
      (v) => (_.isArray(v)
        ? _.compose(
          _.map,
          _.update('[1].proj'),
          _.mapValues,
        )
        : _.compose(
          _.update('proj'),
          _.mapValues,
        )
      )(prepareProjectionConfig)(v),
    ),
    _.mapValues(prepareSchemaConfig),
    _.pickBy((v, k) => /^[A-Z]/.test(k)),
  )(configs);
  logger.info(`Total config: ${JSON.stringify(ncfgs, null, 2)}`);
  return {
    root,
    config: ncfgs,
    pick: _.mapValues(pickType)(ncfgs),
  };
}

module.exports = {
  prepareProjectionConfig,
  prepareSchemaConfig,
  prepareConfig,
};
