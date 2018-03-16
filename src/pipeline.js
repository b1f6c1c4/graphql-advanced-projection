const _ = require('lodash');
const { makeTraverser } = require('./core');
const {
  proj,
  makePrefix,
  typeFunc,
  fieldFunc,
  stepFunc,
} = require('./projection');
const logger = require('../logger');

const finalize = (root, { project, lookup }) => [
  { $project: _.assign({}, root, project) },
  ...lookup.map((l) => ({ $lookup: l })),
];

const makePipeline = makeTraverser({
  typeFunc,
  fieldFunc({ configs, config, field }, [prefix], recursion) {
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
          legacy,
        } = def.reference;
        _.assign(result, proj('LocalField', pf, localField));
        if (legacy) {
          return {
            project: result,
            lookup: [{
              from,
              localField: pf + localField,
              foreignField,
              as,
            }],
          };
        }
        return {
          project: result,
          lookup: [{
            from,
            let: { v1: `$${pf + localField}` },
            pipeline: [
              { $match: { [foreignField]: '$$v1' } },
              ...finalize(configs.root, recursion([prefix])),
            ],
            as,
          }],
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

const genPipeline = ({ root, pick }) => {
  const pipeliner = makePipeline({ root, pick });
  return (info) => {
    try {
      const result = finalize(root, pipeliner(info));
      logger.debug('Pipeline result', result);
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
  makePipeline,
  genPipeline,
};
