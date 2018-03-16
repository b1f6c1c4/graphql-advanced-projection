const _ = require('lodash');

const stripType = (typeRef) => {
  if (typeRef.ofType) {
    return stripType(typeRef.ofType);
  }
  return typeRef.name;
};

const makeTraverser = ({ typeFunc, fieldFunc, stepFunc, reduceFunc }, seed) => (pick) => {
  const func = (root, context, type) => (args) => {
    const { info } = root;
    const config = (pick[type] || _.constant({}))(info);
    const fieldResults = [];
    const typeResult = typeFunc({ config, type }, args);
    context.selectionSet.selections.forEach((sel) => {
      const field = _.get(sel, 'name.value');
      switch (sel.kind) {
        case 'Field': {
          const typeRef = info.schema.getType(type);
          const next = stripType(typeRef.getFields()[field].type);
          const recursion = sel.selectionSet ? func(root, sel, next) : undefined;
          fieldResults.push(fieldFunc({
            config,
            type,
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
            config,
            type,
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
            config,
            type,
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
    return reduceFunc({
      config,
      type,
    }, typeResult, fieldResults);
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
