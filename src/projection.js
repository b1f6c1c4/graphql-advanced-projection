const _ = require('lodash/fp');
const { stripType, makeProjection } = require('./core');
const logger = require('../logger');

module.exports.genProjection = ({ root, pick }) => (info) => {
  try {
    const context = info.fieldNodes[0];
    const type = stripType(info.returnType);
    const result = _.reduce(_.assign, {})([root, makeProjection(
      { pick, info },
      context,
      '',
      type,
    )]);
    logger.debug('Project result', result);
    return result;
  } catch (e) {
    /* istanbul ignore next */
    logger.error('Projecting', e);
    /* istanbul ignore next */
    return undefined;
  }
};
