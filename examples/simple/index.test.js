const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('.');
const { run, connect, disconnect } = require('..');

const { make } = jestMongoose(models, connect, disconnect);

it('userId', async () => {
  await make.User({ _id: 'the-id' });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    userId
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        userId: 'the-id',
      },
    },
  });
});

it('field1', async () => {
  await make.User({ _id: 'the-id', mongoA: 'value' });
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
        field1: 'value',
      },
    },
  });
});

it('field2', async () => {
  await make.User({ _id: 'the-id' });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    field2
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        field2: 'Hello World',
      },
    },
  });
});
