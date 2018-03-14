const _ = require('lodash/fp');
const logger = require('../logger');

function makeResolver(configs, pick) {
  logger.trace('makeResolver', configs);
  const res = _.compose(
    _.fromPairs,
    _.map((k) => [k, (parent, args, context, info) => {
      const cfg = pick(info);
      const select = _.get(['proj', k, 'select'])(cfg);
      return _.get(select || k)(parent);
    }]),
    _.uniq,
    _.flatMap(_.keys),
    _.map('[1].proj'),
  )(configs);
  logger.trace('Generated resolver', _.keys(res));
  return res;
}

const genResolvers = ({ config, pick }) => _.mergeWith(makeResolver)(config, pick);

module.exports = {
  makeResolver,
  genResolvers,
};
