const _ = require('lodash');
const debug = require('debug')('graphql-advanced-projection');

const print = (k) => (message, data) => {
  const msg = `${k}: ${message}`;
  if (data === undefined) {
    debug(msg);
  } else {
    debug(`${msg} %O`, data);
  }
};

_.keys({
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
}).forEach((k) => {
  module.exports[k] = print(k);
});
