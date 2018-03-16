const _ = require('lodash');
const { makeTraverser } = require('./core');
const logger = require('../logger');

const makePrefix = (prev, cur, subs) => {
  let curr = cur;
  if (curr === undefined) {
    curr = subs;
  }
  if (!curr) {
    return prev;
  }
  if (curr.startsWith('.')) {
    return curr.substr(1);
  }
  return prev + curr;
};

const proj = (reason, pf, k) => {
  const result = {};
  if (_.isArray(k)) {
    k.forEach((v) => {
      logger.trace(`>${reason}`, pf + v);
      result[pf + v] = 1;
    });
    return result;
  }
  /* istanbul ignore else */
  if (_.isString(k)) {
    logger.trace(`>${reason}`, pf + k);
    result[pf + k] = 1;
    return result;
  }
  /* istanbul ignore next */
  throw new Error(`Proj not supported: ${k}`);
};

const typeFunc = ({ config }, [prefix]) => {
  if (config.typeProj) {
    const pf = makePrefix(prefix, config.prefix);
    return proj('TypeProj', pf, config.typeProj);
  }
  return {};
};

const fieldFunc = ({ config, field }, [prefix]) => {
  const def = _.get(config.proj, field);
  const query = def === undefined ? field : def.query;
  if (query === null) {
    logger.trace('>Ignored');
    return {};
  }
  const pf = makePrefix(prefix, config.prefix);
  return proj('Simple', pf, query);
};

const stepFunc = ({ config, field, type, next }, [prefix], recursion) => {
  logger.debug('Projecting (inline) fragment', field);
  const newPrefix = type.name === next.name
    ? prefix
    : makePrefix(prefix, config.prefix);
  return recursion([newPrefix]);
};

const makeProjection = makeTraverser({
  typeFunc,
  fieldFunc({ config, field }, [prefix], recursion) {
    const result = fieldFunc({ config, field }, [prefix]);
    const def = _.get(config.proj, field);
    if (recursion && def && def.recursive) {
      const pf = makePrefix(prefix, config.prefix);
      return _.assign(result, recursion([makePrefix(pf, def.prefix, `${field}.`)]));
    }
    return result;
  },
  stepFunc,
  reduceFunc(configs, typeResult, fieldResults) {
    return _.assign({}, typeResult, ...fieldResults);
  },
}, ['']);

const genProjection = ({ root, pick }) => {
  const projector = makeProjection({ pick });
  return (info) => {
    try {
      const result = _.assign({}, root, projector(info));
      logger.debug('Project result', result);
      return result;
    } catch (e) {
      /* istanbul ignore next */
      logger.error('Projecting', e);
      /* istanbul ignore next */
      return undefined;
    }
  };
};

module.exports = {
  proj,
  makePrefix,
  typeFunc,
  fieldFunc,
  stepFunc,
  makeProjection,
  genProjection,
};
