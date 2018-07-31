const _ = require('lodash');
const { makeTraverser } = require('./core');
const {
  makePrefix,
  typeFunc,
  fieldFunc,
} = require('./projection');
const logger = require('../logger');

const joinMeta = (prev, next) => {
  if (prev === '') {
    return next;
  }
  return `${prev}.${next}`;
};

const makeRef = makeTraverser({
  typeFunc: (cfg, [, prefix]) => typeFunc(cfg, [prefix]),
  fieldFunc({ config, field }, [metaPath, prefix], recursion) {
    const result = { [metaPath]: fieldFunc({ config, field }, [prefix]) };
    const def = _.get(config.proj, field);
    if (recursion && def) {
      const pf = makePrefix(prefix, config.prefix);
      if (def.recursive) {
        const newArgs = [metaPath, makePrefix(pf, def.prefix, `${field}.`)];
        const project = recursion(newArgs);
        return _.merge(result, project);
      }
      if (def.reference) {
        const {
          as,
        } = def.reference;
        const project = recursion([joinMeta(metaPath, as), '']);
        return _.merge(result, project);
      }
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
    return _.merge({}, { [metaPath]: typeResult }, ...fieldResults);
  },
}, ['', '']);

const genRef = ({ root, pick }) => {
  const projector = makeRef({ root, pick });
  return (info) => {
    const result = _.mapValues(projector(info), (p) => _.assign({}, root, p));
    logger.debug('Ref result', result);
    return result;
  };
};

module.exports = {
  makeRef,
  genRef,
};
