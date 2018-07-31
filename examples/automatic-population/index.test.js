const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('./');
const { run, connect } = require('../');

const { make } = jestMongoose(models, connect);

it('simple', async (done) => {
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
  done();
});

it('populate', async (done) => {
  await make.SubItem({ _id: 'sub1', content: 'foo1' });
  await make.SubItem({ _id: 'sub2', content: 'foo2' });
  await make.SubItem({ _id: 'sub3', content: 'foo3' });

  await make.Item({ _id: 'item1', mongoD: 'd1', subsId: ['sub1', 'sub2'] });
  await make.Item({ _id: 'item2', mongoD: 'd2', subsId: ['sub1', 'sub3'] });
  await make.User({
    _id: 'the-id',
    itemsId: ['item1', 'item2'],
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    items {
      itemId
      field4
      subs {
        content
      }
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        items: [
          { itemId: 'item1', field4: 'd1', subs: [{ content: 'foo1' }, { content: 'foo2' }] },
          { itemId: 'item2', field4: 'd2', subs: [{ content: 'foo1' }, { content: 'foo3' }] },
        ],
      },
    },
  });
  done();
});
