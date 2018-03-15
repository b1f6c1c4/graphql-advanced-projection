const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genResolvers } = require('./src/resolver');

const gqlProjection = (config) => {
  const ncfgs = prepareConfig(config);
  return {
    project: genProjection(ncfgs),
    resolvers: genResolvers(ncfgs),
  };
};

module.exports = gqlProjection;
module.exports.default = gqlProjection;
module.exports.gqlProjection = gqlProjection;
module.exports.prepareConfig = prepareConfig;
module.exports.genProjection = genProjection;
module.exports.genResolvers = genResolvers;
