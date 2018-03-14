const _ = require('lodash');
const logger = require('../logger');

function makeResolver(configs, pick) {
  logger.trace('makeResolver', configs);
  const res = {};
  _.uniq(configs.map(([, { proj }]) => _.keys(proj))).forEach((k) => {
    res[k] = (parent, args, context, info) => {
      const cfg = pick(info);
      const select = _.get(cfg, ['proj', k, 'select']);
      return _.get(parent, select);
    };
  });
  logger.trace('Generated resolver', _.keys(res));
  return res;
}

const genResolvers = ({ config, pick }) => _.chain(config)
  .pickBy((v, k) => /^[A-Z]/.test(k))
  .mapValues((v, k) => makeResolver(v, pick[k]))
  .value();

module.exports = {
  makeResolver,
  genResolvers,
};
