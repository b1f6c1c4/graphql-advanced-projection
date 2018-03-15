const _ = require('lodash');

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
 *     [NUMBER]: [Number],
 *     key: [Number],
 *     [ACCEPT]: true | false,
 *   },
 * ]
 *
 */

const EPSILON = Symbol('epsilon');
const ANY = Symbol('any');
const NUMBER = Symbol('number');
const ACCEPT = Symbol('accept');

const extend = (NFA, states) => {
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
  return extended;
};

const run = (NFA, input) => {
  let states = extend(NFA, new Set([0]));
  for (let id = 0; id < input.length; id += 1) {
    const char = input[id];
    const next = new Set();
    states.forEach((state) => {
      const cfg = NFA[state];
      if (cfg[ANY]) {
        next.add(...cfg[ANY]);
      }
      if (_.isNumber(char) && cfg[NUMBER]) {
        next.add(...cfg[NUMBER]);
      }
      if (cfg[char]) {
        next.add(...cfg[char]);
      }
    });
    if (!next.size) {
      return false;
    }
    states = extend(NFA, next);
  }
  let accept = false;
  states.forEach((state) => { accept = accept || NFA[state][ACCEPT]; });
  return !!accept;
};

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

const matchSchema = (cfg) => {
  const NFA = [{}];
  cfg.forEach((c) => {
    if (c === null) {
      appendAny(NFA);
    } else {
      appendExact(NFA, c);
    }
  });
  NFA[NFA.length - 1][ACCEPT] = true;
  return (path) => run(NFA, path);
};

const matchSchemas = (cfgs) => {
  const ms = cfgs.map(matchSchema);
  return (path) => ms.some((m) => m(path));
};

const pickType = (config) => {
  if (!_.isArray(config)) {
    return _.constant(config);
  }
  const matchers = config.map(([cfgs]) => matchSchemas(cfgs));
  return (info) => {
    const path = unwindPath(info.path);
    const id = matchers.findIndex((m) => m(path));
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
