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

const makeProjection = makeTraverser({
  typeFunc({ config }, [prefix]) {
    if (config.typeProj) {
      const pf = makePrefix(prefix, config.prefix);
      return proj('TypeProj', pf, config.typeProj);
    }
    return {};
  },
  fieldFunc({ config, field }, [prefix], recursion) {
    let result;
    logger.debug('Projecting field', field);
    const def = _.get(config.proj, field) || { query: field };
    const pf = makePrefix(prefix, config.prefix);
    if (def.query === null) {
      logger.trace('>Ignored');
      result = {};
    } else {
      result = proj('Simple', pf, def.query);
    }
    if (def.recursive && recursion) {
      result = _.assign(result, recursion([makePrefix(pf, def.prefix, `${field}.`)]));
    }
    return result;
  },
  stepFunc({ config, field, type, next }, [prefix], recursion) {
    logger.debug('Projecting (inline) fragment', field);
    const newPrefix = type === next
      ? prefix
      : makePrefix(prefix, config.prefix);
    return recursion([newPrefix]);
  },
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
  makeProjection,
  genProjection,
};
