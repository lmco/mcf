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
 * find, create, updated, and delete. Does NOT test the artifact
 * controller but instead directly manipulates data using mongoose to check
 * the artifact model methods, validators, setters, and getters.
 */

// NPM modules
const chai = require('chai');
const path = require('path'); // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let org = null;
let project = null;
let branch = null;


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
    org = {
      _id: testData.orgs[0].id,
      name: testData.orgs[0].name
    };

    project = {
      _id: utils.createID(org._id, testData.projects[1].id),
      name: testData.projects[1].name,
      org: org._id
    };

    branch = {
      _id: utils.createID(project._id, testData.branches[0].id),
      name: testData.branches[0].name,
      project: project._id
    };

    try {
      await db.connect();
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
  after( async() => {
    try {
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
  it('should test static get populate fields', getStaticPopFields);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via model and save it to the database.
 */
async function createArtifact() {
  // Create the full artifact ID
  const artifactID = testData.artifacts[0].id;

  // Upload new artifact
  const artifact = new Artifact({
    _id: utils.createID(branch._id, artifactID),
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename),
    project: project._id,
    branch: branch._id,
    location: testData.artifacts[0].location,
    history: testData.artifacts[0].history[0]
  });

  try {
    // Save artifact object to the database
    const createdArtifact = await artifact.save();
    chai.expect(createdArtifact.id).to.equal(
      utils.createID(branch._id, testData.artifacts[0].id)
    );
    chai.expect(createdArtifact.filename).to.equal(
      testData.artifacts[0].filename
    );
    chai.expect(createdArtifact.contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(createdArtifact.project).to.equal(project._id);
    chai.expect(createdArtifact.branch).to.equal(branch._id);
    chai.expect(createdArtifact.location).to.equal(testData.artifacts[0].location);
    chai.expect(createdArtifact.history[0].hash).to.equal(
      testData.artifacts[0].history[0].hash
    );
    chai.expect(createdArtifact.history[0].user).to.equal(
      testData.artifacts[0].history[0].user
    );
    chai.expect(createdArtifact.history[0].updatedOn).to.not.equal(null);
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
      { _id: utils.createID(branch._id, testData.artifacts[0].id) }
    );

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
      { _id: utils.createID(branch._id, testData.artifacts[0].id) }
    );

    // Check if artifact found
    chai.expect(artifactToUpdate.length).to.equal(1);

    // Update the filename
    artifactToUpdate[0].filename = testData.artifacts[2].filename;
    // Save the updated artifact
    const updatedArtifact = await artifactToUpdate[0].save();
    chai.expect(updatedArtifact.id).to.equal(
      utils.createID(branch._id, testData.artifacts[0].id)
    );
    chai.expect(updatedArtifact.filename).to.equal(
      testData.artifacts[2].filename
    );
    chai.expect(updatedArtifact.contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(updatedArtifact.project).to.equal(project._id);
    chai.expect(updatedArtifact.branch).to.equal(branch._id);
    chai.expect(updatedArtifact.location).to.equal(testData.artifacts[0].location);
    chai.expect(updatedArtifact.history[0].hash).to.equal(
      testData.artifacts[0].history[0].hash
    );
    chai.expect(updatedArtifact.history[0].user).to.equal(
      testData.artifacts[0].history[0].user
    );
    chai.expect(updatedArtifact.history[0].updatedOn).to.not.equal(null);
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
    const artifactQuery = { _id: utils.createID(branch._id, testData.artifacts[0].id) };
    // Find and delete the artifact
    await Artifact.findOneAndRemove(artifactQuery);

    // Ensure artifact deleted
    const deletedArtifact = await Artifact.find(artifactQuery);
    chai.expect(deletedArtifact.length).to.equal(0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Get and validate the populated fields for artifacts.
 */
async function getStaticPopFields() {
  const validPopulatedFields = ['archivedBy', 'lastModifiedBy', 'createdBy', 'project'];
  // Ensure corrent populate fields
  chai.expect(validPopulatedFields).to.eql(Artifact.getValidPopulateFields());
}
