const _ = require('lodash');
const { normalize, pickType } = require('./schema');
const validate = require('./validate');
const { stripType, makeProjection } = require('./core');
const logger = require('../logger');

module.exports = (configs) => {
  const root = configs.root || { _id: 0 };
  const ncfgs = _.mapValues(configs, (config) =>
    normalize(config).map(([m, { proj, ...other }]) =>
      [m, { proj: _.mapValues(proj, validate), ...other }]));
  logger.info('Total config', ncfgs);
  const pick = _.mapValues(ncfgs, pickType);
  return (info) => {
    const context = info.fieldNodes[0];
    logger.trace('returnType', info.returnType);
    const type = stripType(info.returnType);
    logger.trace('Stripped returnType', type);
    const config = _.mapValues(pick, (p) => p(info));
    try {
      return _.assign(root, makeProjection(
        { config, info },
        context,
        '',
        type,
      ));
    } catch (e) {
      /* istanbul ignore next */
      logger.error('Projecting', e);
      /* istanbul ignore next */
      return undefined;
    }
  };
};
