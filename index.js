const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genPopulation } = require('./src/population');
const { genResolvers } = require('./src/resolver');

const gqlProjection = (config) => {
  const ncfgs = prepareConfig(config);

  return {
    project: genProjection(ncfgs),
    populator: genPopulation(ncfgs),
    resolvers: genResolvers(ncfgs),
  };
};

module.exports = gqlProjection;
module.exports.default = gqlProjection;
module.exports.gqlProjection = gqlProjection;
module.exports.prepareConfig = prepareConfig;
module.exports.genProjection = genProjection;
module.exports.genPopulation = genPopulation;
module.exports.genResolvers = genResolvers;
