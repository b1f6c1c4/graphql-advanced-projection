const _ = require('lodash');
const logger = require('../logger');

module.exports = (config) => {
  logger.trace('genResolver', config);
  if (!config.proj) {
    return {};
  }
  const res = {};
  Object.keys(config.proj).forEach((k) => {
    const def = config.proj[k];
    if (typeof def === 'string') {
      res[k] = (v) => _.get(v, def);
    } else if (def.select) {
      res[k] = (v) => _.get(v, def.select);
    }
  });
  logger.trace('Generated resolver', Object.keys(res));
  return res;
};
