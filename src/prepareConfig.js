const _ = require('lodash/fp');
const { pickType } = require('./schema');
const logger = require('../logger');

function prepareRefConfig(ref, fieldName, query) {
  if (!ref) {
    return undefined;
  }
  if (_.isString(ref)) {
    return prepareRefConfig({ as: ref }, fieldName, query);
  }
  const { as } = ref;
  return {
    as: as || fieldName,
  };
}

function prepareProjectionConfig(def, fieldName) {
  if (def === undefined) {
    return { query: fieldName };
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
  const query = def.query === undefined ? fieldName : def.query;
  const reference = prepareRefConfig(def.reference, fieldName, query);
  return {
    query,
    select: def.select,
    recursive: def.recursive ? true : undefined,
    prefix: def.prefix,
    reference,
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
    _.mapValues.convert({ cap: false })(
      (v) => (_.isArray(v)
        ? _.compose(
          _.map,
          _.update('[1].proj'),
          _.mapValues.convert({ cap: false }),
        )
        : _.compose(
          _.update('proj'),
          _.mapValues.convert({ cap: false }),
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
  prepareRefConfig,
  prepareProjectionConfig,
  prepareSchemaConfig,
  prepareConfig,
};
