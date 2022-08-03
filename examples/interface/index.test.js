const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('.');
const { run, connect, disconnect } = require('..');

const { make } = jestMongoose(models, connect, disconnect);

it('User.field1', async () => {
  await make.User({
    _id: 'the-id',
    type: 'admin',
    mongoA: 123,
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    field1
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field1: 123,
      },
    },
  });
});

it('User.field1 with typename', async () => {
  await make.User({
    _id: 'the-id',
    type: 'admin',
    mongoA: 123,
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    __typename
    field1
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        __typename: 'AdminUser',
        field1: 123,
      },
    },
  });
});

it('AdminUser.field1', async () => {
  await make.User({
    _id: 'the-id',
    type: 'admin',
    mongoA: 123,
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    ... on AdminUser {
      field1
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field1: 123,
      },
    },
  });
});

it('NormalUser.field1', async () => {
  await make.User({
    _id: 'the-id',
    type: 'normal',
    mongoA: 123,
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    ... on NormalUser {
      field1
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field1: 123,
      },
    },
  });
});

it('field2', async () => {
  await make.User({
    _id: 'the-id',
    type: 'admin',
    mongoB: 'value',
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    ... on AdminUser {
      field2
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field2: 'value',
      },
    },
  });
});

it('field3', async () => {
  await make.User({
    _id: 'the-id',
    type: 'normal',
    mongoC: 'value',
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    ...frag
  }
}

fragment frag on NormalUser {
  field3
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field3: 'value',
      },
    },
  });
});
