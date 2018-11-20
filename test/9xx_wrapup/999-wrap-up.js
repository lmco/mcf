/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.999-wrap-up
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This "test" is used to clear the database after tests.
 * SHOULD NOT run against production databases.
 * Intended use in Continuous Integration/Continuous Delivery(Jenkins)
 * test to ensure the database is empty and improve CI testing.
 */

// Node modules
const chai = require('chai');

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
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
  before(() => db.connect());

  /* Runs after all tests. Close database connection. */
  after(() => db.disconnect());

  /* Execute the tests */
  it('clean database', cleanDB);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Cleans out the database by removing all
 * items from all MongoDB collections.
 */
function cleanDB(done) {
  mongoose.connection.db.dropDatabase()
  .then(() => done())
  .catch(error => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
