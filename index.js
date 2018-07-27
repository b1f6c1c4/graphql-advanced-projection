const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genRef } = require('./src/ref');
const { genResolvers } = require('./src/resolver');

const gqlProjection = (config) => {
  const ncfgs = prepareConfig(config);
  return {
    project: genProjection(ncfgs),
    projects: genRef(ncfgs),
    resolvers: genResolvers(ncfgs),
  };
};

module.exports = gqlProjection;
module.exports.default = gqlProjection;
module.exports.gqlProjection = gqlProjection;
module.exports.prepareConfig = prepareConfig;
module.exports.genProjection = genProjection;
module.exports.genProjections = genRef;
module.exports.genResolvers = genResolvers;
