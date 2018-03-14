const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('./');
const { run, connect } = require('../');

const { make } = jestMongoose(models, connect);

it('item.field4', async (done) => {
  await make.Item({
    _id: 'item-id',
    mongoE: 'ccc',
  });
  const result = await run(gql, `
query {
  item(id: "item-id") {
    field4
  }
}
`);
  expect(result).toEqual({
    data: {
      item: {
        field4: 'ccc',
      },
    },
  });
  done();
});

it('user.items.field4', async (done) => {
  await make.User({
    _id: 'the-id',
    items: [
      { mongoD: 'aaa' },
      { mongoD: 'bbb' },
    ],
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
          { field4: 'aaa' },
          { field4: 'bbb' },
        ],
      },
    },
  });
  done();
});
