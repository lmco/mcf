/**
 * @classification UNCLASSIFIED
 *
 * @module test.402b-org-controller-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Phillip Lee
 *
 * @description This tests for expected errors within the org controller.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const db = M.require('db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let testOrg0 = null;
let testOrg1 = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin user. Creates two test orgs.
   */
  before((done) => {
    // Connect to the database
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((user) => {
      // Set global admin user
      adminUser = user;

      // Create the orgs
      return OrgController.create(adminUser,
        [testData.orgs[0], testData.orgs[1]]);
    })
    .then((createdOrgs) => {
      testOrg0 = createdOrgs[0];
      testOrg1 = createdOrgs[1];

      // Expect createdOrgs array to contain 2 orgs
      chai.expect(createdOrgs.length).to.equal(2);
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
   * After: Delete admin user. Deletes the two test orgs.
   */
  after(async () => {
    try {
      // Removing admin user
      await testUtils.removeTestAdmin();
      // Remove the test orgs
      await OrgController.remove(adminUser, [testOrg0._id, testOrg1._id]);
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute the tests */
  // -------------- Find --------------
  // TODO: it('should reject an unauthorized attempt to find an org', unauthorizedTest('find'));
  // ------------- Create -------------
  // TODO: it('should reject an unauthorized attempt to create an org', unauthorizedTest('create'));
  // TODO: it('should reject an attempt to create an org that already exists', createExisting);
  // ------------- Update -------------
  // TODO: it('should reject an unauthorized attempt to update an org', unauthorizedTest('update'));
  // TODO: it('should reject an attempt to update an archived org', updateArchived);
  // ------------- Replace ------------
  // TODO: it('should reject an unauthorized attempt to replace an org',
  //  unauthorizedTest('createOrReplace'));
  it('should reject an attempt to replace an org with an invalid id', replaceInvalidId);
  it('should reject an attempt to replace an org without an id', replaceWithoutId);
  // ------------- Remove -------------
  // TODO: it('should reject an unauthorized attempt to delete an org', unauthorizedTest('delete'));
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies createOrReplace() call with an invalid id does not delete existing orgs.
 */
async function replaceInvalidId() {
  // Create the test org objects
  const testOrgObj0 = testData.orgs[0];
  const testOrgObj1 = testData.orgs[1];
  const invalidOrgObj = { id: '!!', name: 'org name' };

  await OrgController.createOrReplace(adminUser, [testOrgObj0, testOrgObj1, invalidOrgObj])
  .should.eventually.be.rejectedWith(
    `Organization validation failed: _id: Invalid org ID [${invalidOrgObj.id}].`
  );

  let foundOrgs;
  try {
    // Expected error, find valid orgs
    foundOrgs = await OrgController.find(adminUser, [testOrgObj0.id, testOrgObj1.id]);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Expect to find 2 orgs
  foundOrgs.length.should.equal(2);
}

/**
 * @description Verifies createOrReplace() call without an id does not delete existing orgs.
 * Note: This test should fail prior to deletion of existing orgs.
 */
async function replaceWithoutId() {
  // Create the test org objects
  const testOrgObj0 = testData.orgs[0];
  const testOrgObj1 = testData.orgs[1];
  const invalidOrgObj = { name: 'missing id' };

  // Expect operation to be rejected with specific error message.
  await OrgController.createOrReplace(adminUser,
    [testOrgObj0, testOrgObj1, invalidOrgObj])
  .should.eventually.be.rejectedWith('Org #3 does not have an id.');

  try {
    // Expected error, find valid orgs
    const foundOrgs = await OrgController.find(adminUser, [testOrgObj0.id, testOrgObj1.id]);
    foundOrgs.length.should.equal(2);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
