const _ = require('lodash');
const validate = require('./validate');
const logger = require('../logger');

const stripType = (typeRef) => {
  if (typeRef.ofType) {
    return stripType(typeRef.ofType);
  }
  return typeRef.name;
};

const makePrefix = (prev, cur, subs) => {
  let curr = cur;
  if (curr === undefined) {
    curr = subs;
  }
  if (!curr) {
    return prev;
  }
  if (curr.startsWith('.')) {
    return curr.substr(1);
  }
  return prev + curr;
};

function gen(
  root,
  context,
  prefix = '',
  type = context.typeCondition.name.value,
) {
  const { config, info } = root;
  logger.debug('Projecting type', type);
  let cfg = config[type];
  if (!cfg) {
    logger.debug('Type not found, default everywhere', type);
    cfg = {};
  }
  const result = {};
  const pf = makePrefix(prefix, cfg.prefix);
  const proj = (reason, k) => {
    if (_.isArray(k)) {
      k.forEach((v) => {
        logger.trace(`>${reason}`, pf + v);
        result[pf + v] = 1;
      });
      return;
    }
    /* istanbul ignore else */
    if (_.isString(k)) {
      logger.trace(`>${reason}`, pf + k);
      result[pf + k] = 1;
      return;
    }
    /* istanbul ignore next */
    throw new Error(`Proj not supported: ${k}`);
  };
  if (cfg.typeProj) {
    proj('TypeProj', cfg.typeProj);
  }
  context.selectionSet.selections.forEach((sel) => {
    switch (sel.kind) {
      case 'Field': {
        logger.debug('Projecting field', sel.name.value);
        const def = validate(_.get(cfg.proj, sel.name.value));
        if (def.query === undefined) {
          proj('Default', sel.name.value);
        } else if (def.query === null) {
          logger.trace('>Ignored');
        } else {
          proj('Simple', def.query);
        }
        if (def.recursive && sel.selectionSet) {
          const typeRef = info.schema.getType(type);
          /* istanbul ignore if */
          if (!typeRef) {
            /* istanbul ignore next */
            throw new Error('Type not found', type);
          }
          logger.trace('typeRef', typeRef.toString());
          const field = typeRef.getFields()[sel.name.value];
          /* istanbul ignore if */
          if (!field) {
            /* istanbul ignore next */
            throw new Error('Field not found', sel.name.value);
          }
          const nextTypeRef = field.type;
          logger.trace('nextTypeRef', nextTypeRef.toString());
          const core = stripType(nextTypeRef);
          logger.trace('Recursive', core);
          _.assign(result, gen(root, sel, makePrefix(pf, def.prefix, `${sel.name.value}.`), core));
        }
        return;
      }
      case 'InlineFragment': {
        logger.debug('Projecting inline fragment');
        const core = _.get(sel, 'typeCondition.name.value') || type;
        logger.trace('Recursive', core);
        _.assign(result, gen(root, sel, pf, core));
        return;
      }
      case 'FragmentSpread':
        logger.debug('Projecting fragment', sel.name.value);
        logger.trace('Recursive', sel.name.value);
        _.assign(result, gen(root, info.fragments[sel.name.value], pf));
        return;
      /* istanbul ignore next */
      default:
        /* istanbul ignore next */
        throw new Error(`sel.kind not supported: ${sel.kind}`);
    }
  });
  return result;
}

module.exports = (config) => (info) => {
  const context = info.fieldNodes[0];
  logger.trace('returnType', info.returnType);
  const type = stripType(info.returnType);
  logger.trace('Stripped returnType', type);
  try {
    const res = gen({ config, info }, context, undefined, type);
    return _.assign({ _id: 0 }, res);
  } catch (e) {
    logger.error('Projecting', e);
    return undefined;
  }
};
