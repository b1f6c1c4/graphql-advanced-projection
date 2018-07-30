const makeSelect = (relation, projections) => {
  const select = {};
  const otherProjections = [];

  projections
    .filter(([first, ...nested]) => first === relation && nested.length)
  // eslint-disable-next-line no-unused-vars
    .map(([first, ...nested]) => nested)
    .forEach(([second, ...nested]) => {
      select[second] = 1;
      if (nested.length) {
        otherProjections.push([second, ...nested]);
      }
    });

  return {
    select,
    otherProjections,
  };
};

const makePopulation = (paths, projections) => {
  const [path, ...nestedPaths] = paths;

  // eslint-disable-next-line no-unused-vars
  if (!projections.some(([rootProjection, ..._]) => rootProjection === path)) {
    return { path: '' };
  }

  const { select, otherProjections } = makeSelect(path, projections);

  if (!nestedPaths.length) {
    return {
      path,
      select,
    };
  }

  return {
    path,
    select,
    populate: makePopulation(nestedPaths, otherProjections),
  };
};


const convertProjectionsToArrayOfPaths = (projections) => {
  const paths = {};
  const addToPaths = ([first, ...others]) => {
    if (others.length) {
      paths[first] = 1;
      addToPaths(others);
    }
  };

  projections.forEach(addToPaths);
  return Object.keys(paths);
};

const genPopulation = (projections) => {
  const splitProjections = Object.keys(projections || {})
    .map((projection) => projection.split('.'));
  const paths = convertProjectionsToArrayOfPaths(splitProjections);

  return makePopulation(
    paths,
    splitProjections,
  );
};

module.exports = {
  genPopulation,
};
