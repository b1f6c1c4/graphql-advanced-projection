const { prepareConfig } = require('./src/prepareConfig');
const { genProjection } = require('./src/projection');
const { genPipeline } = require('./src/pipeline');
const { genResolvers } = require('./src/resolver');

const gqlProjection = (config) => {
  const ncfgs = prepareConfig(config);
  return {
    project: genProjection(ncfgs),
    pipeline: genPipeline(ncfgs),
    resolvers: genResolvers(ncfgs),
  };
};

module.exports = gqlProjection;
module.exports.default = gqlProjection;
module.exports.gqlProjection = gqlProjection;
module.exports.prepareConfig = prepareConfig;
module.exports.genProjection = genProjection;
module.exports.genPipeline = genPipeline;
module.exports.genResolvers = genResolvers;
