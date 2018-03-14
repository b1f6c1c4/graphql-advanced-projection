const _ = require('lodash');
const { stripType, makeProjection } = require('./core');
const logger = require('../logger');

module.exports.genProjection = ({ root, pick }) => {
  logger.trace('genProjection');
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
