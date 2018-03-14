const _ = require('lodash/fp');
const { stripType, makeProjection } = require('./core');
const logger = require('../logger');

module.exports.genProjection = ({ root, pick }) => {
  logger.trace('genProjection');
  return (info) => {
    const context = info.fieldNodes[0];
    logger.trace('returnType', info.returnType);
    const type = stripType(info.returnType);
    logger.trace('Stripped returnType', type);
    try {
      return _.reduce(_.assign, {})([root, makeProjection(
        { pick, info },
        context,
        '',
        type,
      )]);
    } catch (e) {
      /* istanbul ignore next */
      logger.error('Projecting', e);
      /* istanbul ignore next */
      return undefined;
    }
  };
};
