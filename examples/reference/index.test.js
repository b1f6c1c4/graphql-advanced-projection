const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('.');
const { run, connect, disconnect } = require('..');

const { make } = jestMongoose(models, connect, disconnect);

it('itemId', async () => {
  await make.Item({ _id: 'item1', mongoD: 'd1' });
  await make.Item({ _id: 'item2', mongoD: 'd2' });
  await make.User({
    _id: 'the-id',
    itemsId: ['item1', 'item2'],
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    items {
      itemId
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        items: [
          { itemId: 'item1' },
          { itemId: 'item2' },
        ],
      },
    },
  });
});

it('field4', async () => {
  await make.Item({ _id: 'item1', mongoD: 'd1' });
  await make.Item({ _id: 'item2', mongoD: 'd2' });
  await make.User({
    _id: 'the-id',
    itemsId: ['item1', 'item2'],
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    items {
      field4
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        items: [
          { field4: 'd1' },
          { field4: 'd2' },
        ],
      },
    },
  });
});
