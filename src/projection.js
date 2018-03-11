const _ = require('lodash');
const validate = require('./validate');
const logger = require('../logger');

const stripType = (typeRef) => {
  if (typeRef.ofType) {
    return stripType(typeRef.ofType);
  }
  return typeRef.name;
};

function gen(
  root,
  context,
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
  const prefix = cfg.prefix || '';
  const proj = (reason, k) => {
    if (_.isArray(k)) {
      k.forEach((v) => {
        logger.trace(`>${reason}`, prefix + v);
        result[prefix + v] = 1;
      });
      return;
    }
    /* istanbul ignore else */
    if (_.isString(k)) {
      logger.trace(`>${reason}`, prefix + k);
      result[prefix + k] = 1;
      return;
    }
    /* istanbul ignore next */
    throw new Error(`Proj not supported: ${k}`);
  };
  if (cfg.typeProj) {
    proj('TypeProj', cfg.typeProj);
  }
  const sels = context.selectionSet.selections;
  try {
    sels.forEach((sel) => {
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
            _.assign(result, gen(root, sel, core));
          }
          return;
        }
        case 'InlineFragment': {
          logger.debug('Projecting inline fragment');
          const core = _.get(sel, 'typeCondition.name.value') || type;
          logger.trace('Recursive', core);
          _.assign(result, gen(root, sel, core));
          return;
        }
        case 'FragmentSpread':
          logger.debug('Projecting fragment', sel.name.value);
          logger.trace('Recursive', sel.name.value);
          _.assign(result, gen(root, info.fragments[sel.name.value]));
          return;
        /* istanbul ignore next */
        default:
          /* istanbul ignore next */
          throw new Error(`sel.kind not supported: ${sel.kind}`);
      }
    });
    return result;
  } catch (e) {
    /* istanbul ignore next */
    logger.error('Projecting', e);
    /* istanbul ignore next */
    return undefined;
  }
}

module.exports = (config) => (info) => {
  const context = info.fieldNodes[0];
  logger.trace('returnType', info.returnType);
  const type = stripType(info.returnType);
  logger.trace('Stripped returnType', type);
  const res = gen({ config, info }, context, type);
  /* istanbul ignore if */
  if (!res) {
    /* istanbul ignore next */
    return undefined;
  }
  return _.assign({ _id: 0 }, res);
};
