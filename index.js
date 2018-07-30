const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genResolvers } = require('./src/resolver');
const { genPopulation } = require('./src/population');

const gqlProjection = (config) => {
  const ncfgs = prepareConfig(config);
  const project = genProjection(ncfgs);

  const parseInfo = (info) => {
    const projection = project(info);
    return {
      projection,
      population: genPopulation(projection),
    };
  };

  return {
    project,
    resolvers: genResolvers(ncfgs),
    populate: (info) => genPopulation(project(info)),
    parseInfo,
  };
};

module.exports = gqlProjection;
module.exports.default = gqlProjection;
module.exports.gqlProjection = gqlProjection;
module.exports.prepareConfig = prepareConfig;
module.exports.genProjection = genProjection;
module.exports.genResolvers = genResolvers;
