const _ = require('lodash');
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

function makeProjection(
  root,
  context,
  prefix,
  type,
) {
  const { pick, info } = root;
  logger.debug('Projecting type', type);
  const cfg = (pick[type] || _.constant({}))(info);
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
    const fieldName = _.get(sel, 'name.value');
    switch (sel.kind) {
      case 'Field': {
        logger.debug('Projecting field', fieldName);
        const def = _.get(cfg.proj, fieldName) || { query: fieldName };
        if (def.query === null) {
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
          const field = typeRef.getFields()[fieldName];
          /* istanbul ignore if */
          if (!field) {
            /* istanbul ignore next */
            throw new Error('Field not found', fieldName);
          }
          const nextTypeRef = field.type;
          logger.trace('nextTypeRef', nextTypeRef.toString());
          const core = stripType(nextTypeRef);
          logger.trace('Recursive', core);
          _.assign(result, makeProjection(
            root,
            sel,
            makePrefix(pf, def.prefix, `${fieldName}.`),
            core,
          ));
        }
        return;
      }
      case 'InlineFragment': {
        logger.debug('Projecting inline fragment');
        const newType = _.get(sel, 'typeCondition.name.value');
        const newPrefix = newType ? pf : prefix;
        const core = newType || type;
        logger.trace('Recursive', { type: core, prefix: newPrefix });
        _.assign(result, makeProjection(
          root,
          sel,
          newPrefix,
          core,
        ));
        return;
      }
      case 'FragmentSpread': {
        logger.debug('Projecting fragment', fieldName);
        const frag = info.fragments[fieldName];
        const newType = _.get(frag, 'typeCondition.name.value');
        const newPrefix = newType !== type ? pf : prefix;
        logger.trace('Recursive', { type: newType, prefix: newPrefix });
        _.assign(result, makeProjection(
          root,
          frag,
          newPrefix,
          newType,
        ));
        return;
      }
      /* istanbul ignore next */
      default:
        /* istanbul ignore next */
        throw new Error(`sel.kind not supported: ${sel.kind}`);
    }
  });
  return result;
}

module.exports = {
  stripType,
  makeProjection,
};
