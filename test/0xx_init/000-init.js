/**
 * Classification: UNCLASSIFIED
 *
 * @module test.000-init
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
 * @description This "test" is used to clean out the database before other
 * tests. It SHOULD NOT be run if testing against production databases. It
 * is intended for use in CI/CD testing to ensure the database is empty and
 * improve CI testing.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const Artifact = M.require('models.artifact');
const Branch = M.require('models.branch');
const Element = M.require('models.element');
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const ServerData = M.require('models.server-data');
const User = M.require('models.user');
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
  before((done) => {
    db.connect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * Runs after all tests. Close database connection.
   */
  after((done) => {
    db.disconnect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * Execute the tests
   */
  it('should initialize the models', initModels);
  it('clean database', cleanDB);
  it('should create the default org if it doesn\'t exist', createDefaultOrg);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Initializes all models asynchronously.
 * @async
 *
 * @return {Promise<void>}
 */
async function initModels() {
  try {
    await Artifact.init();
    await Branch.init();
    await Element.init();
    await Organization.init();
    await Project.init();
    await ServerData.init();
    await User.init();
  }
  catch (error) {
    M.log.critical('Failed to initialize models.');
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Cleans out the database by removing all items from all
 * collections.
 */
function cleanDB(done) {
  db.clear()
  .then(() => ServerData.insertMany([{ _id: 'server_data', version: M.schemaVersion }]))
  // Ensure element indexes are created prior to running other tests
  .then(() => Element.ensureIndexes())
  // Ensure user indexes are created prior to running other tests
  .then(() => User.ensureIndexes())
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
  Organization.findOne({ _id: M.config.server.defaultOrganizationId })
  .then((org) => {
    // Verify return statement
    chai.expect(org).to.equal(null);

    // Create default org object
    const defOrg = Organization.createDocument({
      _id: M.config.server.defaultOrganizationId,
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
