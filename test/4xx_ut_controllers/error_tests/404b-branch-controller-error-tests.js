/**
 * @classification UNCLASSIFIED
 *
 * @module test.404b-branch-controller-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Leah De Laurell
 *
 * @description This tests for expected errors within the branch controller.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const BranchController = M.require('controllers.branch-controller');
const db = M.require('db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let proj = null;
let projID = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, and project.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org._id);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj._id).pop();

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
   * After: Remove Organization and project.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects under organization will also be removed
    testUtils.removeTestOrg()
    .then(() => testUtils.removeTestAdmin())
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
  // -------------- Find --------------
  // TODO: it('should reject an unauthorized attempt to find a branch', unauthorizedTest('find'));
  // ------------- Create -------------
  // TODO: it('should reject an unauthorized attempt to create a branch',
  //  unauthorizedTest('create'));
  // TODO: it('should reject an attempt to create a branch on an archived org',
  //  archivedTest(Organization, 'create'));
  // TODO: it('should reject an attempt to create a branch on an archived project',
  //  archivedTest(Project, 'update'));
  // TODO: it('should reject an attempt to create a branch that already exists', createExisting);
  // ------------- Update -------------
  // TODO: it('should reject an unauthorized attempt to update a branch',
  //  unauthorizedTest('update'));
  // TODO: it('should reject an attempt to update a branch on an archived org',
  //  archivedTest(Organization, 'update'));
  // TODO: it('should reject an attempt to update a branch on an archived project',
  //  archivedTest(Project, 'update'));
  // TODO: it('should reject an attempt to update an archived branch',
  //  archivedTest(Branch, 'update'));
  // ------------- Remove -------------
  // TODO: it('should reject an unauthorized attempt to delete a branch',
  //  unauthorizedTest('remove'));
  // TODO: it('should reject an attempt to delete a branch on an archived org',
  //  archivedTest(Organization, 'remove'));
  // TODO: it('should reject an attempt to delete a branch on an archived project',
  //  archivedTest(Project, 'remove'));
  it('should reject deletion of master branch', deleteMasterBranch);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that master branch can not be deleted.
 */
async function deleteMasterBranch() {
  const branchID = testData.branches[0].id;

  // Attempt to remove the master branch; should be rejected
  await BranchController.remove(adminUser, org._id, projID, branchID)
  .should.eventually.be.rejectedWith(`User cannot delete branch: ${branchID}.`);
}
