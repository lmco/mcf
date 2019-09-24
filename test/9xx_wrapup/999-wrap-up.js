/**
 * Classification: UNCLASSIFIED
 *
 * @module test.999-wrap-up
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
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
});

/* --------------------( Tests )-------------------- */
/**
 * @description Cleans out the database by removing all items from all
 * collections.
 */
function cleanDB(done) {
  db.clear()
  .then(() => ServerData.insertMany({ _id: 'server_data', version: M.schemaVersion }))
  .then(() => done())
  .catch(error => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
