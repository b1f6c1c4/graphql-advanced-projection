const _ = require('lodash/fp');
const logger = require('../logger');

function makeResolver(configs, pick) {
  logger.trace('makeResolver', configs);
  let fn;
  if (!_.isArray(configs)) {
    fn = _.compose(
      _.mapValues(_.get),
      _.pickBy(_.identity),
      _.mapValues(_.get('select')),
      _.get('proj'),
    );
  } else {
    fn = _.compose(
      _.fromPairs,
      _.map((k) => [k, (parent, args, context, info) => {
        const cfg = pick(info);
        const select = _.get(['proj', k, 'select'])(cfg);
        return _.get(select || k)(parent);
      }]),
      _.uniq,
      _.flatMap(_.keys),
      _.map('[1].proj'),
    );
  }
  const res = fn(configs);
  logger.trace('Generated resolver', _.keys(res));
  return res;
}

const genResolvers = ({ config, pick }) => {
  const result = _.mergeWith(makeResolver)(config, pick);
  logger.info('Resolvers', _.mapValues(_.keys)(result));
  return result;
};

module.exports = {
  makeResolver,
  genResolvers,
};
