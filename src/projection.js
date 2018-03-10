const _ = require('lodash');
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
  const cfg = config[type];
  if (!cfg) {
    logger.debug('Type not found, default everywhere', type);
  }
  const proj = {};
  const prefix = (cfg && cfg.prefix) || '';
  if (cfg && cfg.typeProj) {
    logger.trace('>TypeProj', prefix + cfg.typeProj);
    proj[prefix + cfg.typeProj] = 1;
  }
  const sels = context.selectionSet.selections;
  try {
    sels.forEach((sel) => {
      switch (sel.kind) {
        case 'Field': {
          logger.debug('Projecting field', sel.name.value);
          const def = cfg && _.get(cfg.proj, sel.name.value);
          const goDefault = () => {
            if (!sel.selectionSet) {
              logger.trace('>Default', prefix + sel.name.value);
              proj[prefix + sel.name.value] = 1;
            } else {
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
              Object.assign(proj, gen(root, sel, core));
            }
          };
          const goSimple = (v) => {
            if (Array.isArray(v)) {
              v.forEach(goSimple);
            } else {
              logger.trace('>Simple', prefix + v);
              proj[prefix + v] = 1;
            }
          };
          if (!def) {
            goDefault();
            return;
          }
          if (typeof def === 'string') {
            goSimple(def);
            return;
          }
          if (Array.isArray(def)) {
            goSimple(def);
            return;
          }
          if (def.query) {
            goSimple(def.query);
          }
          if (def.recursive && sel.selectionSet) {
            goDefault();
          } else if (!def.query) {
            logger.trace('>Ignored');
          }
          return;
        }
        case 'InlineFragment': {
          logger.debug('Projecting inline fragment');
          const core = _.get(sel, 'typeCondition.name.value') || type;
          logger.trace('Recursive', core);
          Object.assign(proj, gen(root, sel, core));
          return;
        }
        case 'FragmentSpread':
          logger.debug('Projecting fragment', sel.name.value);
          logger.trace('Recursive', sel.name.value);
          Object.assign(proj, gen(root, info.fragments[sel.name.value]));
          return;
        /* istanbul ignore next */
        default:
          /* istanbul ignore next */
          throw new Error(`sel.kind not supported: ${sel.kind}`);
      }
    });
    return proj;
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
