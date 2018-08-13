/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/000-init
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  This "test" is used to clean out the database before other
 * tests. It SHOULD NOT be run if testing against production databases. It
 * is intended for use in CI/CD testing to ensure the database is empty and
 * improve CI testing.
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose');

// Load mbee modules
const User = M.require('models.User');
const Organization = M.require('models.Organization');
const Project = M.require('models.Project');
const Element = M.require('models.Element');
const db = M.require('lib.db');


/* --------------------( Main )-------------------- */

console.log('THIS IS A DEMO');

/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), function() {
  /* Runs before all tests . Opens the database connection. */
  before(() => db.connect());

  /* Runs after all tests. Close database connection. */
  after(() => mongoose.connection.close());

  /* Execute the tests */
  it('clean database', cleanDB);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Cleans out the database by removing all items from all MongoDB
 * collections.
 */
function cleanDB(done) {
  User.remove({}).exec()                          // Remove the users
  .then(() => Organization.remove({}).exec())     // Then remove the orgs
  .then(() => Project.remove({}).exec())          // Then remove the projects
  .then(() => Element.Element.remove({}).exec())  // Then remove the elements
  .then(() => done())                             // Then finish the test
  .catch(error => {                               // Catch any errors
    chai.expect(error).to.equal(null);            // expect no errors
  });
}
