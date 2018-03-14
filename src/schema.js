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

function normalize(config) {
  const norm = (cfg) => {
    if (cfg === undefined) {
      return [[null]];
    }
    if (cfg === null) {
      return [];
    }
    if (_.isString(cfg)) {
      return [[cfg, null]];
    }
    if (!_.isArray(cfg)) {
      throw new Error('Incorrect match config');
    }
    if (cfg.length > 0 && !_.isArray(cfg[0])) {
      return [cfg];
    }
    return cfg;
  };
  if (_.isArray(config)) {
    return config.map(([m, t]) => [norm(m), t]);
  }
  return [[{}, config]];
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

const matchSchema = (cfg) => (path) => {
  const NFA = [{}];
  cfg.forEach((c) => {
    if (c === null) {
      appendAny(NFA);
    } else {
      appendExact(NFA, c);
    }
  });
  NFA[NFA.length - 1][ACCEPT] = true;
  return run(NFA, path);
};

module.exports = {
  unwindPath,
  normalize,
  matchSchema,
};
