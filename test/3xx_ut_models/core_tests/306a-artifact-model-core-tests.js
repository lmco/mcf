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
 * @description Tests creating, updating and deleting artifacts through the
 * model. Tests the artifact model by performing various actions such as a
 * find, create, updated, and delete. Does NOT test the artifact
 * controller but instead directly manipulates data to check the artifact model
 * methods, validators, setters, and getters.
 */

// NPM modules
const chai = require('chai');
const path = require('path'); // Find directory paths
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Artifact = M.require('models.artifact');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const org = testData.orgs[0];
const project = testData.projects[0];
const branch = testData.branches[0];


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
  after(async () => {
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
  const artifact = Artifact.createDocument({
    _id: utils.createID(org.id, project.id, branch.id, artifactID),
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename),
    project: utils.createID(org.id, project.id),
    branch: utils.createID(org.id, project.id, branch.id),
    location: testData.artifacts[0].location,
    history: testData.artifacts[0].history[0]
  });

  try {
    // Save artifact object to the database
    const createdArtifact = await artifact.save();
    chai.expect(createdArtifact._id).to.equal(
      utils.createID(org.id, project.id, branch.id, testData.artifacts[0].id)
    );
    chai.expect(createdArtifact.filename).to.equal(
      testData.artifacts[0].filename
    );
    chai.expect(createdArtifact.contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(createdArtifact.project).to.equal(utils.createID(org.id, project.id));
    chai.expect(createdArtifact.branch).to.equal(utils.createID(org.id, project.id, branch.id));
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
      { _id: utils.createID(org.id, project.id, branch.id, testData.artifacts[0].id) }
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
    const artID = utils.createID(org.id, project.id, branch.id, testData.artifacts[0].id);
    // Update the name of the artifact created in the createArtifact() test
    await Artifact.updateOne({ _id: artID }, { filename: 'Updated Name' });

    // Find the updated artifact
    const foundArtifact = await Artifact.findOne({ _id: artID });

    chai.expect(foundArtifact._id).to.equal(
      utils.createID(org.id, project.id, branch.id, testData.artifacts[0].id)
    );
    chai.expect(foundArtifact.filename).to.equal('Updated Name');
    chai.expect(foundArtifact.contentType).to.equal(
      path.extname(testData.artifacts[0].filename)
    );
    chai.expect(foundArtifact.project).to.equal(utils.createID(org.id, project.id));
    chai.expect(foundArtifact.branch).to.equal(utils.createID(org.id, project.id, branch.id));
    chai.expect(foundArtifact.location).to.equal(testData.artifacts[0].location);
    chai.expect(foundArtifact.history[0].hash).to.equal(
      testData.artifacts[0].history[0].hash
    );
    chai.expect(foundArtifact.history[0].user).to.equal(
      testData.artifacts[0].history[0].user
    );
    chai.expect(foundArtifact.history[0].updatedOn).to.not.equal(null);
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
  const artID = utils.createID(org.id, project.id, branch.id, testData.artifacts[0].id);

  // Remove the artifact
  await Artifact.deleteMany({ _id: artID });

  // Attempt to find the artifact
  const foundArtifact = await Artifact.findOne({ _id: artID });

  // foundArtifact should be null
  should.not.exist(foundArtifact);
}

/**
 * @description Get and validate the populated fields for artifacts.
 */
async function getStaticPopFields() {
  const validPopulatedFields = ['archivedBy', 'lastModifiedBy', 'createdBy', 'project'];
  // Ensure correct populate fields
  chai.expect(validPopulatedFields).to.eql(Artifact.getValidPopulateFields());
}
