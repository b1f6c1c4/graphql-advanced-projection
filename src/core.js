const _ = require('lodash');

const stripType = (typeRef) => {
  if (typeRef.ofType) {
    return stripType(typeRef.ofType);
  }
  return typeRef.name;
};

const makeTraverser = ({ typeFunc, fieldFunc, stepFunc, reduceFunc }, seed) => (configs) => {
  const { pick } = configs;
  const func = (root, context, type) => (args) => {
    const { info } = root;
    const config = (pick[type] || _.constant({}))(info);
    const cfgs = { configs, config, type };
    const fieldResults = [];
    const typeResult = typeFunc(cfgs, args);
    context.selectionSet.selections.forEach((sel) => {
      const field = _.get(sel, 'name.value');
      switch (sel.kind) {
        case 'Field': {
          const typeRef = info.schema.getType(type);
          const fieldValue = typeRef.getFields()[field];
          if  (!fieldValue) {
            return;
          }
          const next = stripType(fieldValue.type);
          const recursion = sel.selectionSet ? func(root, sel, next) : undefined;
          fieldResults.push(fieldFunc({
            ...cfgs,
            field,
            next,
          }, args, recursion));
          return;
        }
        case 'InlineFragment': {
          const newType = _.get(sel, 'typeCondition.name.value');
          const next = newType || type;
          const recursion = func(root, sel, next);
          fieldResults.push(stepFunc({
            ...cfgs,
            field,
            next,
          }, args, recursion));
          return;
        }
        case 'FragmentSpread': {
          const frag = info.fragments[field];
          const next = _.get(frag, 'typeCondition.name.value');
          const recursion = func(root, frag, next);
          fieldResults.push(stepFunc({
            ...cfgs,
            field,
            next,
          }, args, recursion));
          return;
        }
        /* istanbul ignore next */
        default:
          /* istanbul ignore next */
          throw new Error(`sel.kind not supported: ${sel.kind}`);
      }
    });
    return reduceFunc(cfgs, typeResult, fieldResults);
  };
  return (info) => {
    const context = info.fieldNodes[0];
    const type = stripType(info.returnType);
    return func(
      { info },
      context,
      type,
    )(seed);
  };
};

module.exports = {
  stripType,
  makeTraverser,
};
