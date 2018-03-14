const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genResolvers } = require('./src/resolver');

module.exports = {
  default: prepareConfig,
  prepareConfig,
  genProjection,
  genResolvers,
};
