const _ = require('lodash');

const stripType = (typeRef) => {
  const arr = typeRef.constructor.name === 'GraphQLList' ? 1 : 0;
  if (typeRef.ofType) {
    const res = stripType(typeRef.ofType);
    res.level += arr;
    return res;
  }
  return { name: typeRef.name, level: 0 };
};

const makeTraverser = ({ typeFunc, fieldFunc, stepFunc, reduceFunc }, seed) => (configs) => {
  const { pick } = configs;
  const func = (root, context, type) => (args) => {
    const { info } = root;
    const config = (pick[type.name] || _.constant({}))(info);
    const cfgs = { configs, config, type };
    const fieldResults = [];
    const typeResult = typeFunc(cfgs, args);
    context.selectionSet.selections.forEach((sel) => {
      const field = _.get(sel, 'name.value');
      switch (sel.kind) {
        case 'Field': {
          const typeRef = info.schema.getType(type.name);
          const next = stripType(typeRef.getFields()[field].type);
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
          const next = newType ? { name: newType, level: 0 } : type;
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
          const newType = _.get(frag, 'typeCondition.name.value');
          const next = { name: newType, level: 0 };
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
    return reduceFunc(cfgs, args, typeResult, fieldResults);
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
