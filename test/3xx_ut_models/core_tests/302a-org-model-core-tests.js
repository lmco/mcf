/**
 * Classification: UNCLASSIFIED
 *
 * @module test.302a-org-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Tests the organization model by performing various actions
 * such as a create, archive, and delete. The test Does NOT test the
 * organization controller but instead directly manipulates data using the
 * database interface to check the organization model's methods, validators,
 * setters, and getters.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Org = M.require('models.organization');
const db = M.require('lib.db');

// Variables used across test functions
let userAdmin = null;

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open database connection and creates admin
   * user.
   */
  before((done) => {
    db.connect()
    // Create admin user
    .then(() => testUtils.createTestAdmin())
    .then((user) => {
      userAdmin = user;
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: runs after all tests. Deletes admin user and close database
   * connection.
   */
  after((done) => {
    // Remove admin user
    testUtils.removeTestAdmin()
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create an organization', createOrg);
  it('should find an organization', findOrg);
  it('should update an organization', updateOrg);
  it('should get all permissions of an organization', findOrgPermissions);
  it('should archive an organization', archiveOrg);
  it('should delete an organization', deleteOrg);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an organization using the Organization model.
 */
async function createOrg() {
  // Create an organization from the Organization model object
  const org = new Org({
    _id: testData.orgs[0].id,
    name: testData.orgs[0].name,
    permissions: {
      admin: [userAdmin._id],
      write: [userAdmin._id],
      read: [userAdmin._id]
    }
  });
  try {
    // Save the Organization model object to the database
    await org.save();
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Finds an organization using the Organization Model
 */
async function findOrg() {
  let org;
  try {
    // Find the created organization from the previous createOrg() test
    org = await Org.findOne({ _id: testData.orgs[0].id });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Verify correct org is returned
  org.id.should.equal(testData.orgs[0].id);
  org._id.should.equal(testData.orgs[0].id);
  org.name.should.equal(testData.orgs[0].name);
}

/**
 * @description Updates an organization using the Organization Model
 */
async function updateOrg() {
  try {
    // Find and update the org created in the previous createOrg() test
    const foundOrg = await Org.findOne({ _id: testData.orgs[0].id });
    foundOrg.name = testData.orgs[0].name;
    const updatedOrg = await foundOrg.save();
    // Verify org is updated correctly
    updatedOrg.id.should.equal(testData.orgs[0].id);
    updatedOrg.name.should.equal(testData.orgs[0].name);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Finds permissions an organization using the Organization Model.
 */
async function findOrgPermissions() {
  let org;
  try {
    // Finds permissions on the org created in the previous createOrg() test
    org = await Org.findOne({ _id: testData.orgs[0].id });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Confirming user permissions are in organization
  org.permissions.write[0].toString().should.equal(userAdmin._id.toString());
}

/**
 * @description Archives the organization previously created in createOrg().
 */
async function archiveOrg() {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the archived and archivedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc

  let org;
  let foundOrg;
  try {
    // Find the previously created organization from createOrg.
    org = await Org.findOne({ _id: testData.orgs[0].id });
    // Set the archived field of the organization to true
    org.archived = true;
    org.archivedOn = Date.now();
    // Save the updated organization object to the database
    await org.save();
    // Find the previously updated organization
    foundOrg = await Org.findOne({ _id: org.id });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Verify the organization has been archived.
  foundOrg.archivedOn.should.not.equal(null);
  foundOrg.archived.should.equal(true);
}

/**
 * @description Deletes the previously created organization from createOrg.
 */
async function deleteOrg() {
  try {
    // find and remove the organization
    await Org.findOneAndRemove({ _id: testData.orgs[0].id });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
