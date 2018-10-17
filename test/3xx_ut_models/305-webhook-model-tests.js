// Node modules
const chai = require('chai');

// MBEE modules
const Webhook = M.require('models.webhook');
const db = M.require('lib/db');

describe(M.getModuleName(module.filename), () => {

  /**
   * Runs before all tests . Opens the database connection.
   */
  before(() => db.connect());

  /**
   * Runs after all tests. Close database connection.
   */
  after(() => db.disconnect());

  /**
   * Execute the tests
   */
  it('should work', createWebhook);
});

function createWebhook(done) {
  const webhook = new Webhook({
    id: '123',
    name: 'First Webhook',
    responses: [
      {
        url: 'https://google.com',
        method: 'GET',
        data: 'Hello world!'
      },
      {
        url: 'https://apple.com',
        method: 'POST',
        data: 'Goodbye world!'
      }
    ]
  });

  webhook.save()
  .then((webhook) => {
    chai.expect(webhook.id).to.equal('123');
    done();
  })
  .catch((error) => {
    console.log(error);
    chai.expect(error.message).to.equal(null);
    done();
  });
}
