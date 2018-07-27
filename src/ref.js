const _ = require('lodash');
const { makeTraverser } = require('./core');
const {
  makePrefix,
  typeFunc,
  fieldFunc,
  stepFunc,
} = require('./projection');
const logger = require('../logger');

const finalize = (root, { project, lookup }) => [
  ...lookup.map((l) => ({ $lookup: l })),
  { $project: _.assign({}, root, project) },
];

const makeRef = makeTraverser({
  typeFunc,
  fieldFunc({ config, field }, [prefix], recursion) {
    const result = fieldFunc({ config, field }, [prefix]);
    const def = _.get(config.proj, field);
    if (recursion && def) {
      const pf = makePrefix(prefix, config.prefix);
      if (def.recursive) {
        const newArgs = [makePrefix(pf, def.prefix, `${field}.`)];
        const { project, lookup } = recursion(newArgs);
        return {
          project: _.assign(result, project),
          lookup,
        };
      }
      if (def.reference) {
        const {
          from,
          localField,
          foreignField,
          as,
        } = def.reference;
        const { project, lookup } = recursion([`${as}.`]);
        const directField = `${as}.${foreignField}`;
        if (_.keys(project).length === 1
          && project[directField] === 1
          && lookup.length === 0) {
          _.set(result, [as, '$map'], {
            input: `$${pf}${localField}`,
            as: 'id',
            in: { [foreignField]: '$$id' },
          });
          return {
            project: result,
            lookup: [],
          };
        }
        _.assign(result, project);
        return {
          project: result,
          lookup: [{
            from,
            localField: pf + localField,
            foreignField,
            as,
          }, ...lookup],
        };
      }
    }
    return { project: result, lookup: [] };
  },
  stepFunc,
  reduceFunc(configs, typeResult, fieldResults) {
    return {
      project: _.assign({}, typeResult, ..._.map(fieldResults, 'project')),
      lookup: _.flatMap(fieldResults, 'lookup'),
    };
  },
}, ['']);

const genRef = ({ root, pick }) => {
  const pipeliner = makeRef({ root, pick });
  return (info) => {
    try {
      const result = finalize(root, pipeliner(info));
      logger.debug('Ref result', result);
      return result;
    } catch (e) {
      /* istanbul ignore next */
      logger.error('Pipelining', e);
      /* istanbul ignore next */
      return undefined;
    }
  };
};

module.exports = {
  makeRef,
  genRef,
};
