const _ = require('lodash');
const fp = require('lodash/fp');
const { makeTraverser } = require('./core');
const {
  makePrefix,
  typeFunc,
  fieldFunc,
} = require('./projection');
const logger = require('../logger');

const makePopulation = makeTraverser({
  typeFunc: (cfg, [, prefix]) => typeFunc(cfg, [prefix]),
  fieldFunc({ root, config, field }, [metaPath, prefix], recursion) {
    const result = {
      path: metaPath,
      select: fieldFunc({ config, field }, [prefix]),
    };
    const def = _.get(config.proj, field);
    if (recursion && def) {
      const pf = makePrefix(prefix, config.prefix);
      if (def.recursive) {
        const newArgs = [metaPath, makePrefix(pf, def.prefix, `${field}.`)];
        const project = recursion(newArgs);
        return _.merge(result, project);
      }
      if (!_.isString(def.query)) {
        throw new Error('genPopulation with recursive=false must have query: string');
      }
      const populate = _.merge({}, { select: root }, recursion([pf + def.query, ''])); // TODO
      return _.merge(result, { populate });
    }
    return result;
  },
  stepFunc({ config, field, type, next }, [metaPath, prefix], recursion) {
    logger.debug('Projecting (inline) fragment', field);
    const newPrefix = type.name === next.name
      ? prefix
      : makePrefix(prefix, config.prefix);
    return recursion([metaPath, newPrefix]);
  },
  reduceFunc(configs, [metaPath], typeResult, fieldResults) {
    const raw = fp.compose(
      fp.mapValues(fp.reduce(fp.merge, {})),
      fp.groupBy('path'),
      fp.compact,
      fp.map('populate'),
    )(fieldResults);
    const select = fp.compose(
      fp.merge(typeResult),
      fp.reduce(fp.merge, {}),
      fp.map('select'),
    )(fieldResults);
    const populate = fp.values(raw);
    if (populate.length) {
      return {
        path: metaPath,
        select,
        populate,
      };
    }
    return {
      path: metaPath,
      select,
    };
  },
}, ['', '']);

const genPopulation = ({ root, pick }) => {
  const populator = makePopulation({ root, pick });
  return (info) => {
    const { select, populate } = _.merge({}, { select: root }, populator(info));
    const result = { proj: select, popu: populate };
    logger.debug('Population result', result);
    return result;
  };
};

module.exports = {
  makePopulation,
  genPopulation,
};
