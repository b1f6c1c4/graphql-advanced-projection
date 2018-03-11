const _ = require('lodash');
const validate = require('./validate');
const logger = require('../logger');

module.exports = (config) => {
  logger.trace('genResolver', config);
  const res = _.chain(config.proj)
    .mapValues((v) => {
      const { select } = validate(v);
      if (select) {
        return (parent) => _.get(parent, select);
      }
      return undefined;
    })
    .pickBy()
    .value();
  logger.trace('Generated resolver', _.keys(res));
  return res;
};
