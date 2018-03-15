const _ = require('lodash/fp');
const logger = require('../logger');

function unwindPath(path) {
  const result = [];
  let p = path;
  while (p) {
    result.unshift(p.key);
    p = p.prev;
  }
  return result;
}

/*
 * NFA
 *
 * [0]: Initial
 *
 * [
 *   {
 *     [EPSILON]: [Number],
 *     [ANY]: [Number],
 *     [NOTNUMBER]: [Number],
 *     [NUMBER]: [Number],
 *     key: [Number],
 *     [ACCEPT]: true | false,
 *   },
 * ]
 *
 */

const EPSILON = Symbol('epsilon');
const ANY = Symbol('any');
const NOTNUMBER = Symbol('not-number');
const NUMBER = Symbol('number');
const ACCEPT = Symbol('accept');

const extend = (NFA) => (states) => {
  const extended = new Set();
  const queue = [...states];
  while (queue.length) {
    const state = queue.shift();
    extended.add(state);
    const cfg = NFA[state];
    if (cfg[EPSILON]) {
      queue.push(...cfg[EPSILON]);
    }
  }
  return [...extended];
};

const run = (NFA) => _.compose(
  _.some((state) => NFA[state][ACCEPT]),
  _.compose(
    _.reduce((states, char) => _.compose(
      extend(NFA),
      _.reduce((next, state) => {
        const cfg = NFA[state];
        const mer = (k) => {
          if (cfg[k]) {
            next.add(...cfg[k]);
          }
        };
        mer(ANY);
        if (_.isNumber(char)) {
          mer(NUMBER);
        } else {
          mer(NOTNUMBER);
        }
        mer(char);
        return next;
      })(new Set()),
    )(states)),
    extend(NFA),
  )(new Set([0])),
);

const append = (obj, key, val) => {
  if (obj[key]) {
    obj[key].push(val);
  } else {
    // eslint-disable-next-line no-param-reassign
    obj[key] = [val];
  }
};

const appendAny = (NFA) => {
  const len = NFA.length;
  append(NFA[len - 1], EPSILON, len);
  NFA.push({ [ANY]: [len] });
};

const appendExact = (NFA, str) => {
  const len = NFA.length;
  append(NFA[len - 1], str, len);
  NFA.push({ [NUMBER]: [len] });
};

const appendExactOrNothing = (NFA, str) => {
  const len = NFA.length;
  append(NFA[len - 1], str, len);
  append(NFA[len - 1], EPSILON, len + 1);
  NFA.push({ [NUMBER]: [len], [EPSILON]: [len + 1] });
  NFA.push({});
};

const matchSchema = (cfg) => {
  const NFA = _.reduce((n, c) => {
    if (c === null) {
      appendAny(n);
    } else if (c === '') {
      appendExact(n, NOTNUMBER);
    } else if (c === '?') {
      appendExactOrNothing(n, NOTNUMBER);
    } else if (c.endsWith('?')) {
      appendExactOrNothing(n, c.substr(0, c.length - 1));
    } else {
      appendExact(n, c);
    }
    return n;
  })([{}])(cfg);
  NFA[NFA.length - 1][ACCEPT] = true;
  logger.info('NFA', NFA);
  return run(NFA);
};

const matchSchemas = _.compose(
  _.overSome,
  _.map(matchSchema),
);

const pickType = (config) => {
  if (!_.isArray(config)) {
    return _.constant(config);
  }
  const matchers = _.compose(
    _.over,
    _.map(_.compose(
      matchSchemas,
      _.get('0'),
    )),
  )(config);
  return (info) => {
    const id = _.compose(
      _.findIndex(_.identity),
      matchers,
      unwindPath,
      _.get('path'),
    )(info);
    if (id === -1) {
      return {};
    }
    return config[id][1];
  };
};

module.exports = {
  unwindPath,
  append,
  matchSchema,
  pickType,
};
