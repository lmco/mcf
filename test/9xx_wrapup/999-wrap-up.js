/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.999-wrap-up
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
 * @description This "test" is used to clear the database after tests.
 * SHOULD NOT run against production databases.
 * Intended use in Continuous Integration/Continuous Delivery(Jenkins)
 * test to ensure the database is empty and improve CI testing.
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const User = M.require('models.user');
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const Element = M.require('models.element');
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
  // TODO: Should not run if production MBX-401
  // TODO: Allow to run using --force MBX-401
  // Remove users
  User.remove({}).exec()

  // Remove all orgs except for the 'default' org.
  .then(() => Organization.remove({
    name: { $ne: 'default' } }).exec())

  // Remove projects
  .then(() => Project.remove({}).exec())

  // Remove elements
  .then(() => Element.Element.remove({}).exec())
  .then(() => done())
  .catch(error => {
    // Expect no errors
    chai.expect(error).to.equal(null);
    done();
  });
}
