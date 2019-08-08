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
 * @description Tests creating, updating and deleting artifacts through the model.
 * Tests the artifact model by performing various actions such as a
 * find, create, updated, archive, and delete. Does NOT test the artifact
 * controller but instead directly manipulates data using mongoose to check
 * the artifact model methods, validators, setters, and getters.
 */

// Node modules
const chai = require('chai'); // Test framework
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const Branch = M.require('models.branch');
const db = M.require('lib.db');
const mbeeCrypto = M.require('lib.crypto');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let artifactPNG = null;
let org = null;
let project = null;
let projID = null;
let branch = null;
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
  before((done) => {
    db.connect()
    .then(() => {
      // Create the organization model object
      const newOrg = new Org({
        _id: testData.orgs[0].id,
        name: testData.orgs[0].name
      });

      // Save the organization model object to the database
      return newOrg.save();
    })
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        _id: utils.createID(org._id, testData.projects[1].id),
        name: testData.projects[1].name,
        org: org._id
      });

      // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;
      projID = utils.parseID(project.id).pop();
      // Create the branch model object
      const newBranch = new Branch({
        _id: utils.createID(org.id, projID, testData.branches[0].id),
        name: testData.branches[0].name,
        project: project._id
      });

      // Save the project model object to the database
      return newBranch.save();
    })
    .then((retBranch) => {
      // Update branch for test data
      branch = retBranch;
      branchID = utils.parseID(branch.id).pop();

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
   * After: runs after all tests
   */
  after((done) => {
    // Remove the org created in before()
    testUtils.removeTestOrg()
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
  it('should upload an artifact', uploadArtifact);
  it('should find an artifact', findArtifact);
  it('should update an artifact file', updateArtifact);
  it('should delete an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via model and save it to the database.
 */
async function uploadArtifact() {
  // Create the full artifact ID
  const artifactID = testData.artifacts[0].id;

  // Upload new artifact
  const artifact = new Artifact();
  artifact._id = utils.createID(org.id, projID, branchID, artifactID);
  artifact.filename = testData.artifacts[0].filename;
  artifact.contentType = path.extname(testData.artifacts[0].filename);
  artifact.project = utils.createID(org.id, projID);
  artifact.organization = org;

  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  // Get the test file
  artifactPNG = await fs.readFileSync(imgPath);
  artifact.hash = mbeeCrypto.sha256Hash(artifactPNG);

  try {
    // Save user object to the database
    const createArtifact = await artifact.save();
    chai.expect(createArtifact.id).to.equal(
      utils.createID(branch._id, testData.artifacts[0].id)
    );
    chai.expect(createArtifact.project).to.equal(project._id);
    chai.expect(createArtifact.filename).to.equal(
      testData.artifacts[0].filename
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
async function findArtifact() {
  try {
    // Find the artifact previously uploaded.
    const artifactToUpdate = await Artifact.find(
      { _id: utils.createID(branch._id, testData.artifacts[0].id) });

    // Check if artifact found
    chai.expect(artifactToUpdate.length).to.equal(1);
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
  try {
    // Find the artifact previously uploaded.
    const artifactToUpdate = await Artifact.find(
      { _id: utils.createID(branch._id, testData.artifacts[0].id) });

    // Check if artifact found
    chai.expect(artifactToUpdate.length).to.equal(1);

    // Update the filename
    artifactToUpdate[0].filename = testData.artifacts[2].filename;
    // Save the updated artifact
    const artifact = await artifactToUpdate[0].save();
    chai.expect(artifact.filename).to.equal(testData.artifacts[2].filename);
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
    const art_query = { _id: utils.createID(branch._id, testData.artifacts[0].id) }
    // Find and delete the artifact
    await Artifact.findOneAndRemove(art_query);

    const deletedArtifact = await Artifact.find(art_query);
    chai.expect(deletedArtifact.length).to.equal(0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
