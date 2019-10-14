/**
 * @classification UNCLASSIFIED
 *
 * @module test.406b-artifact-controller-error-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This tests for expected errors within the artifact controller.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Node modules
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const ArtifactController = M.require('controllers.artifact-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let orgID = null;
let project = null;
let projectID = null;
let branchID = null;
let tag = null;
let tagID = null;
let artifactBlob = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, project,
   * and artifacts.
   */
  before(async () => {
    // Connect to the database
    await db.connect();

    adminUser = await testUtils.createTestAdmin();
    // Create the organization model object
    org = await testUtils.createTestOrg(adminUser);
    orgID = org.id;


    // Create the project model object
    project = await testUtils.createTestProject(adminUser, orgID);
    projectID = utils.parseID(project.id).pop();
    branchID = testData.branches[0].id;

    // Create tag
    tag = await testUtils.createTag(adminUser, org.id, projectID);
    tagID = utils.parseID(tag.id).pop();

    const artDataObjects = [
      testData.artifacts[0],
      testData.artifacts[1],
      testData.artifacts[2]
    ];

    // Get png test file
    const artifactPath = path.join(
      M.root, testData.artifacts[0].location, testData.artifacts[0].filename
    );

    // Get the test file
    artifactBlob = await fs.readFileSync(artifactPath);
    const artBlobData = {
      project: projectID,
      org: orgID,
      location: testData.artifacts[0].location,
      filename: testData.artifacts[0].filename
    };

    // Create artifacts
    await ArtifactController.postBlob(adminUser, org.id, projectID, artBlobData, artifactBlob);
  });

  /**
   * After: Remove organization, project and artifacts.
   * Close database connection.
   */
  after(async () => {
    try {
      // Remove organization
      // Note: Projects and artifacts under organization will also be removed
      // Remove the org created in before()
      await testUtils.removeTestOrg();
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
  // ------------- Create -------------
  it('should reject creating artifacts to a tag '
    + 'saying artifacts cannot be created.', createInTag);
  it('should create a blog that already exist.', createExistingBlob);
  // ------------- Update -------------
  // it('should reject an update saying a source cannot be set to self', updateSourceToSelf);
  // it('should reject an update saying a target cannot be set to self', updateTargetToSelf);
  // it('should reject an update saying a source cannot be found', updateNonExistentSource);
  // it('should reject an update saying a target cannot be found', updateNonExistentTarget);
  // it('should reject an update saying a target is required when'
  //   + ' updating a source', updateSourceWithNoTarget);
  // it('should reject an update saying a source is required when'
  //   + ' updating a target', updateTargetWithNoSource);
  it('should reject updating artifacts to a tag '
    + 'saying artifacts cannot be update.', updateInTag);
  // // ------------- Replace ------------
  // it('should reject put artifacts with invalid id', putInvalidId);
  // it('should reject put artifacts without id', putWithoutId);
  // ------------- Remove -------------
  it('should reject deleting artifacts in a tag '
    + 'saying artifacts cannot be deleted.', deleteInTag);
  it('should reject deleting non-existing artifacts blob', deleteNonexistingBlob);
  // ------------- Search -------------
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the tag can not create
 * artifacts.
 */
async function createInTag() {
  const artifactObj = testData.artifacts[0];
  // Attempt to create an artifact; should be rejected with specific error message
  await ArtifactController.create(adminUser, org.id, projectID, tagID, artifactObj)
  .should.eventually.be.rejectedWith(`[${tagID}] is a tag and does`
      + ' not allow artifacts to be created, updated, or deleted.');
}

/**
 * @description Verifies that artifact blobs can not be created
 * if already exist.
 */
async function createExistingBlob() {
  // Define test data
  const artData = {
    project: projectID,
    org: orgID,
    location: testData.artifacts[0].location,
    filename: testData.artifacts[0].filename
  };

  // Attempt to create an artifact; should be rejected with specific error message
  await ArtifactController.postBlob(adminUser, org.id, projectID,
    artData, artifactBlob)
  .should.eventually.be.rejectedWith('Artifact blob already exists.');
}

/**
 * @description Verifies that the tag can not update
 * artifacts.
 */
async function updateInTag() {
  // Create the object to update artifact
  const updateObj = {
    name: 'model_edit',
    id: 'model'
  };

  // Update artifact via controller; should be rejected with specific error message
  await ArtifactController.update(adminUser, org.id, projectID, tagID, updateObj)
  .should.eventually.be.rejectedWith(`[${tagID}] is a tag and `
      + 'does not allow artifacts to be created, updated, or deleted.');
}

/**
 * @description Verifies that the tag can not delete
 * artifacts.
 */
async function deleteInTag() {
  // Attempt deleting an artifact via controller; should be rejected with specific error message
  await ArtifactController.remove(adminUser, org.id, projectID, tagID, testData.artifacts[1].id)
  .should.eventually.be.rejectedWith(`[${tagID}] is a tag and`
      + ' does not allow artifacts to be created, updated, or deleted.');
}

/**
 * @description Verifies that an non-existing artifact blobs can not be
 * deleted.
 */
async function deleteNonexistingBlob() {
  // Define test data
  const artData = {
    project: projectID,
    org: orgID,
    location: testData.artifacts[0].location,
    filename: testData.artifacts[0].filename
  };

  // Attempt to delete an artifact
  await ArtifactController.deleteBlob(adminUser, org.id, projectID,
    artData, artifactBlob);

  // Attempt to delete an non-existing artifact
  // Should be rejected with specific error message
  await ArtifactController.deleteBlob(adminUser, org.id, projectID,
    artData, artifactBlob)
  .should.eventually.be.rejectedWith('Artifact Blob not found.');
}

/**
 * @description Verifies invalid Id PUT call does not delete existing artifacts.
 */
async function putInvalidId() {
  // Create the test artifact objects
  const testElemObj0 = testData.artifacts[7];
  const testElemObj1 = testData.artifacts[8];
  const invalidElemObj = { id: 'INVALID_ID', name: 'artifact name' };

  await ArtifactController.createOrReplace(adminUser, org.id, projectID, branchID,
    [testElemObj0, testElemObj1, invalidElemObj])
  .should.eventually.be.rejectedWith('Artifact validation failed: _id: '
      + `Invalid artifact ID [${invalidElemObj.id}].`);

  let foundArtifacts;
  try {
    // Expected error, find valid artifacts
    foundArtifacts = await ArtifactController.find(adminUser, org.id, projectID, branchID,
      [testElemObj0.id, testElemObj1.id]);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Expect to find 2 artifacts
  foundArtifacts.length.should.equal(2);
}

/**
 * @description Verifies PUT call without Id does not delete existing artifacts.
 * Note: This test should fail prior to deletion of existing artifacts.
 */
async function putWithoutId() {
  // Create the test artifacts
  const testElemObj0 = testData.artifacts[7];
  const testElemObj1 = testData.artifacts[8];
  const invalidElemObj = { name: 'missing id' };

  // Try to put artifacts; should be rejected with specific error message
  await ArtifactController.createOrReplace(adminUser, org.id, projectID, branchID,
    [testElemObj0, testElemObj1, invalidElemObj])
  .should.eventually.be.rejectedWith('Artifact #3 does not have an id.');

  let foundElems;
  try {
    // Expected error, find valid artifacts
    foundElems = await ArtifactController.find(adminUser,
      org.id, projectID, branchID, [testElemObj0.id, testElemObj1.id]);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Expect to find 2 artifacts
  foundElems.length.should.equal(2);
}
