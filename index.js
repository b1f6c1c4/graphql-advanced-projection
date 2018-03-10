const _ = require('lodash');
const genProjection = require('./src/projection');
const genResolver = require('./src/resolver');

const genResolvers = (configs) => _.mapValues(configs, genResolver);

module.exports = {
  default: genProjection,
  genProjection,
  genResolver,
  genResolvers,
};
