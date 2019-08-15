/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.306a-artifact-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This tests the Artifact Controller functionality.
 */

// Node modules
const chai = require('chai'); // Test framework
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// MBEE modules
const ArtifactController = M.require('controllers.artifact-controller');
const db = M.require('lib.db');
const mbeeCrypto = M.require('lib.crypto');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let artifactBlob = null;
let artifactHash = null;
let adminUser = null;
let org = null;
let project = null;
let projectID = null;
let branchID = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests
   */
  before(async () => {
    try {
      // Coonnect to the database
      await db.connect();

      adminUser = await testUtils.createTestAdmin();
      // Create the organization model object
      org = await testUtils.createTestOrg(adminUser);

      // Create the project model object
      project = await testUtils.createTestProject(adminUser, org.id);
      projectID = utils.parseID(project.id).pop();
      branchID = testData.branches[0].id;

      // Get png test file
      const imgPath = path.join(
        M.root, testData.artifacts[0].location, testData.artifacts[0].filename
      );

      // Get the test file
      artifactBlob = await fs.readFileSync(imgPath);
      artifactHash = mbeeCrypto.sha256Hash(artifactBlob);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: runs after all tests
   */
  after(async () => {
    try {
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
  it('should create an artifact', createArtifact);
  it('should find an artifact', findArtifact);
  it('should update an artifact file', updateArtifact);
  it('should delete an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via controller.
 */
async function createArtifact() {
  const artData = {
    id: testData.artifacts[0].id,
    name: testData.artifacts[0].name,
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename),
    project: project._id,
    branch: branchID,
    location: testData.artifacts[0].location
  };
  try {
    const createdArtifact = await ArtifactController.create(adminUser, org.id,
      projectID, branchID, artData, artifactBlob);
    chai.expect(createdArtifact[0].id).to.equal(
      utils.createID(org.id, projectID, branchID, testData.artifacts[0].id)
    );
    chai.expect(createdArtifact[0].filename).to.equal(
      testData.artifacts[0].filename
    );
    chai.expect(createdArtifact[0].contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(createdArtifact[0].project).to.equal(project._id);
    chai.expect(createdArtifact[0].branch).to.equal(
      utils.createID(org.id, projectID, branchID)
    );
    chai.expect(createdArtifact[0].location).to.equal(testData.artifacts[0].location);
    chai.expect(createdArtifact[0].history[0].hash).to.equal(
      testData.artifacts[0].history[0].hash
    );
    chai.expect(createdArtifact[0].history[0].user).to.equal(adminUser.id);
    chai.expect(createdArtifact[0].history[0].updatedOn).to.not.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Finds an existing artifact.
 */
async function findArtifact() {
  const artData = [testData.artifacts[0].id];
  try {
    // Find the artifact previously uploaded.
    const foundArtifact = await ArtifactController.find(adminUser, org.id,
      projectID, branchID, artData);
    // Check if artifact found
    chai.expect(foundArtifact.length).to.equal(1);
    chai.expect(foundArtifact[0].id).to.equal(
      utils.createID(org.id, projectID, branchID, testData.artifacts[0].id)
    );
    chai.expect(foundArtifact[0].name).to.equal(
      testData.artifacts[0].name
    );
    chai.expect(foundArtifact[0].filename).to.equal(
      testData.artifacts[0].filename
    );
    chai.expect(foundArtifact[0].contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(foundArtifact[0].project).to.equal(project._id);
    chai.expect(foundArtifact[0].branch).to.equal(
      utils.createID(org.id, projectID, branchID)
    );
    chai.expect(foundArtifact[0].history);
    chai.expect(foundArtifact[0].history[0].hash).to.equal(
      testData.artifacts[0].history[0].hash
    );
    chai.expect(foundArtifact[0].history[0].user).to.equal(adminUser.id);
    chai.expect(foundArtifact[0].history[0].updatedOn).to.not.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Finds an existing artifact and updates it.
 */
async function updateArtifact() {
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[2].location, testData.artifacts[2].filename
  );

  // Get the test file
  const artifactBlob2 = await fs.readFileSync(imgPath);

  const artData = {
    id: testData.artifacts[0].id,
    filename: testData.artifacts[2].filename,
    name: testData.artifacts[2].name,
    contentType: path.extname(testData.artifacts[2].filename),
    location: testData.artifacts[2].location,
    archived: false,
    custom: {}

  };
  try {
    const updatedArtifact = await ArtifactController.update(adminUser, org.id,
      projectID, branchID, artData, artifactBlob2);

    // Check if artifact found
    chai.expect(updatedArtifact.length).to.equal(1);
    chai.expect(updatedArtifact[0].id).to.equal(
      utils.createID(org.id, projectID, branchID, testData.artifacts[0].id)
    );
    chai.expect(updatedArtifact[0].name).to.equal(
      testData.artifacts[2].name
    );
    chai.expect(updatedArtifact[0].filename).to.equal(
      testData.artifacts[2].filename
    );
    chai.expect(updatedArtifact[0].contentType).to.equal(
      path.extname(testData.artifacts[2].filename)
    );
    chai.expect(updatedArtifact[0].project).to.equal(project._id);
    chai.expect(updatedArtifact[0].branch).to.equal(
      utils.createID(org.id, projectID, branchID)
    );
    chai.expect(updatedArtifact[0].location).to.equal(testData.artifacts[2].location);
    chai.expect(updatedArtifact[0].history[1].hash).to.equal(
      testData.artifacts[2].history[0].hash
    );
    chai.expect(updatedArtifact[0].history[0].user).to.equal(adminUser.id);
    chai.expect(updatedArtifact[0].history[0].updatedOn).to.not.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Finds and deletes an artifact.
 */
async function deleteArtifact() {
  try {
    const artifactID = testData.artifacts[0].id;
    // Find and delete the artifact
    const deletedArtifact = await ArtifactController.remove(adminUser,
      org.id, projectID, branchID, artifactID);

    // Check that 1 artifact was deleted
    chai.expect(deletedArtifact.length).to.equal(1);

    const foundArtifact = await ArtifactController.find(adminUser, org.id,
      projectID, branchID, [artifactID]);

    chai.expect(foundArtifact.length).to.equal(0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
