/**
 * @classification UNCLASSIFIED
 *
 * @module test.999-wrap-up
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan
 *
 * @description This "test" is used to clear the database after tests.
 * SHOULD NOT run against production databases.
 * Intended use in Continuous Integration/Continuous Delivery(Jenkins)
 * test to ensure the database is empty and improve CI testing.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const ServerData = M.require('models.server-data');
const db = M.require('lib.db');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /* Runs before all tests . Opens the database connection. */
  before((done) => {
    db.connect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Runs after all tests. Close database connection. */
  after((done) => {
    db.disconnect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('clean database', cleanDB);
  it('should initialize the server data model', initServerDataModel);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Cleans out the database by removing all items from all
 * collections.
 */
async function cleanDB() {
  try {
    await db.clear();
  }
  catch (error) {
    M.log.critical('Failed to clean the database.');
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Initializes the server data model and inserts the single server
 * data document.
 * @async
 *
 * @returns {Promise} Resolves upon successful insertion of the document.
 */
async function initServerDataModel() {
  try {
    await ServerData.init();
    await ServerData.insertMany({ _id: 'server_data', version: M.schemaVersion });
  }
  catch (error) {
    M.log.critical('Failed to insert server data document.');
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
