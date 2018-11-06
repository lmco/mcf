/**
 * Classification: UNCLASSIFIED
 *
 * @module test.000-init
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
 * @description This "test" is used to clean out the database before other
 * tests. It SHOULD NOT be run if testing against production databases. It
 * is intended for use in CI/CD testing to ensure the database is empty and
 * improve CI testing.
 */

// Node modules
const chai = require('chai');
const { execSync } = require('child_process');

// MBEE modules
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const Element = M.require('models.element');
const Artifact = M.require('models.artifact');
const User = M.require('models.user');
const Webhook = M.require('models.webhook');
const db = M.require('lib.db');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), function() {
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
  it('clean database', cleanDB);
  it('should create the default org if it doesn\'t exist', createDefaultOrg);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Cleans out the database by removing all items from all MongoDB
 * collections.
 */
function cleanDB(done) {
  // Set retry number in case another async db operation is happening
  this.retries(3);

  User.collection.drop() // Remove users
  .then(() => Organization.collection.drop()) // Remove organizations
  .then(() => Project.collection.drop()) // Remove projects
  .then(() => Element.Element.collection.drop())  // Remove elements
  .then(() => Webhook.Webhook.collection.drop())  // Remove webhooks
  .then(() => {
    // Remove artifacts
    execSync(`rm -rf ${M.root}/storage/*`);
    return Artifact.collection.drop();
  })
  .then(() => done())
  .catch(error => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}


/**
 * @description Creates the default org if it doesn't already exist
 */
function createDefaultOrg(done) {
  Organization.findOne({ id: M.config.server.defaultOrganizationId })
  .then((org) => {
    // Verify return statement
    chai.expect(org).to.equal(null);

    // Create default org object
    const defOrg = new Organization({
      id: M.config.server.defaultOrganizationId,
      name: M.config.server.defaultOrganizationName,
      createdBy: null,
      lastModifiedBy: null

    });

    // Save the default org
    return defOrg.save();
  })
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
