const _ = require('lodash');
const logger = require('../logger');

function makeResolver(configs, pick) {
  logger.trace('makeResolver', configs);
  const res = {};
  _.chain(configs.map(([, { proj }]) => _.keys(proj)))
    .flatten()
    .uniq()
    .value()
    .forEach((k) => {
      res[k] = (parent, args, context, info) => {
        const cfg = pick(info);
        const select = _.get(cfg, ['proj', k, 'select']);
        return _.get(parent, select || k);
      };
    });
  logger.trace('Generated resolver', _.keys(res));
  return res;
}

const genResolvers = ({ config, pick }) =>
  _.mapValues(config, (v, k) => makeResolver(v, pick[k]));

module.exports = {
  makeResolver,
  genResolvers,
};
