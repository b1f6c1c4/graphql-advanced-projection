const genProjection = require('./src/projection');
const genResolvers = require('./src/resovlers');

module.exports = {
  default: genProjection,
  genProjection,
  genResolvers,
};
