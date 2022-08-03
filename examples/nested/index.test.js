const jestMongoose = require('jest-mongoose');
const models = require('./models');
const gql = require('.');
const { run, connect, disconnect } = require('..');

const { make } = jestMongoose(models, connect, disconnect);

it('alters.field4', async (done) => {
  await make.User({
    _id: 'the-id',
    nested: [
      { mongoC: 123 },
      { mongoC: 456 },
    ],
  });
  const result = await run(gql, `
query {
  user(id: "the-id") {
    alters {
      field3
    }
  }
}
`);
  expect(result).toEqual({
    data: {
      user: {
        alters: [
          { field3: 123 },
          { field3: 456 },
        ],
      },
    },
  });
  done();
});
