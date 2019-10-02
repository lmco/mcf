/**
 * @classification UNCLASSIFIED
 *
 * @module test.406a-artifact-model-tests
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
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let project = null;
let projectID = null;
let branchID = null;
let artifactBlob1 = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests.
   */
  before(async () => {
    try {
      // Connect to the database
      await db.connect();

      adminUser = await testUtils.createTestAdmin();
      // Create the organization model object
      org = await testUtils.createTestOrg(adminUser);

      // Create the project model object
      project = await testUtils.createTestProject(adminUser, org.id);
      projectID = utils.parseID(project.id).pop();
      branchID = testData.branches[0].id;

      // Get png test file
      const artifactPath = path.join(
        M.root, testData.artifacts[0].location, testData.artifacts[0].filename
      );

      // Get the test file
      artifactBlob1 = await fs.readFileSync(artifactPath);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: runs after all tests.
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
  it('should get an artifact', getArtifact);
  it('should post an artifact blob', postBlob);
  it('should get an artifact blob by ID', getBlobByID);
  it('should update an artifact file', updateArtifact);
  it('should get an artifact blob', getBlob);
  it('should delete an artifact', deleteBlob);
  it('should delete an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact.
 */
async function createArtifact() {
  // Define test data
  const artData = {
    id: testData.artifacts[0].id,
    name: testData.artifacts[0].name,
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename),
    project: projectID,
    branch: branchID,
    location: testData.artifacts[0].location
  };
  try {
    const createdArtifact = await ArtifactController.create(adminUser, org.id,
      projectID, branchID, artData);
    chai.expect(createdArtifact[0]._id).to.equal(
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
    chai.expect(createdArtifact[0].location).to.equal(
      testData.artifacts[0].location
    );
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
async function getArtifact() {
  // Define test data
  const artData = [testData.artifacts[0].id];
  try {
    // Find the artifact previously uploaded.
    const foundArtifact = await ArtifactController.find(adminUser, org.id,
      projectID, branchID, artData);
    // Check if artifact found
    chai.expect(foundArtifact.length).to.equal(1);
    chai.expect(foundArtifact[0]._id).to.equal(
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
    chai.expect(foundArtifact[0].location).to.equal(
      testData.artifacts[0].location
    );
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Finds an existing artifact and updates its metadata.
 */
async function updateArtifact() {
  // Define test data
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
      projectID, branchID, artData);

    // Check if artifact found
    chai.expect(updatedArtifact.length).to.equal(1);
    chai.expect(updatedArtifact[0]._id).to.equal(
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
  // Define test data
  const artifactID = testData.artifacts[0].id;

  try {
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

/**
 * @description Post an artifact blob.
 */
async function postBlob() {
  // Define test data
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project._id,
    branch: branchID,
    location: testData.artifacts[0].location
  };

  try {
    const createdArtifact = await ArtifactController.postBlob(adminUser, org.id,
      projectID, branchID, artData, artifactBlob1);

    chai.expect(createdArtifact.filename).to.equal(
      testData.artifacts[0].filename
    );
    chai.expect(createdArtifact.project).to.equal(projectID);
    chai.expect(createdArtifact.branch).to.equal(branchID);
    chai.expect(createdArtifact.location).to.equal(
      testData.artifacts[0].location
    );
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Gets the artifact blob.
 */
async function getBlob() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project._id,
    branch: branchID,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded.
    const artifactBlob = await ArtifactController.getBlob(adminUser,
      org.id, projectID, branchID, artData);

    // Check return artifact is of buffer type
    chai.expect(Buffer.isBuffer(artifactBlob)).to.equal(true);

    // Deep compare both binaries
    chai.expect(artifactBlob).to.deep.equal(artifactBlob1);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Finds and deletes an artifact blob.
 */
async function deleteBlob() {
  try {
    const artifact = {
      project: projectID,
      location: testData.artifacts[0].location,
      filename: testData.artifacts[0].filename
    };

    // Find and delete the artifact
    await ArtifactController.deleteBlob(adminUser,
      org.id, projectID, branchID, artifact);

    const foundArtifact = await ArtifactController.getBlob(adminUser, org.id,
      projectID, branchID, artifact);

    chai.expect(foundArtifact.length).to.equal(0);
  }
  catch (error) {
    // Expect Artifact not found error
    chai.expect(error.message).to.equal('Artifact blob not found.');
  }
}

/**
 * @description Finds an existing artifact blob via id.
 */
async function getBlobByID() {
  const artData = testData.artifacts[0].id;
  try {
    // Find the artifact previously uploaded.
    const artifactBlob = await ArtifactController.getBlobById(adminUser, org.id,
      projectID, branchID, artData);

    // Check return artifact is of buffer type
    chai.expect(Buffer.isBuffer(artifactBlob)).to.equal(true);

    // Deep compare both binaries
    chai.expect(artifactBlob).to.deep.equal(artifactBlob1);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
