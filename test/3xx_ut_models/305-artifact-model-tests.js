/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.301-artifact-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Tests creating, updating and deleting artifacts through the model.
 */

// Node modules
const chai = require('chai'); // Test framework
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib.db');
const mbeeCrypto = M.require('lib.crypto');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
let artifactPNG = null;
let org = null;
let project = null;

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
    db.connect();

    // Create the organization model object
    const newOrg = new Org({
      id: testData.orgs[0].id,
      name: testData.orgs[0].name
    });

    // Save the organization model object to the database
    newOrg.save()
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        id: testData.projects[1].id,
        name: testData.projects[1].name,
        org: org._id,
        uid: `${org.id}:${testData.projects[1].id}`
      });

      // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;

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
    // Remove the project created in before()
    Project.findOneAndRemove({ uid: project.uid })
    // Remove the org created in before()
    .then(() => Org.findOneAndRemove({ id: org.id }))
    .then(() => {
      db.disconnect();
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should upload an artifact', uploadArtifact);
  it('should update an artifact file', updateArtifactFile);
  it('should delete an artifact', deleteArtifactFile);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via model and save it to the database.
 */
function uploadArtifact(done) {
  // Create the full artifact ID
  const artifactID = utils.createUID(org.id, project.id, testData.artifacts[0].id);

  // Upload new artifact
  const artifact = new Artifact();
  artifact.id = artifactID;
  artifact.filename = testData.artifacts[0].filename;
  artifact.contentType = path.extname(testData.artifacts[0].filename);
  artifact.project = project;
  artifact.organization = org;

  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  // Get the test file
  artifactPNG = fs.readFileSync(imgPath);
  artifact.hash = mbeeCrypto.sha256Hash(artifactPNG);

  // Save user object to the database
  artifact.save()
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Finds an existing artifact and updates it.
 */
function updateArtifactFile(done) {
  const artifactFillId = utils.createUID(org.id, project.id, testData.artifacts[0].id);
  // Find the artifact previously uploaded.
  Artifact.find({ id: artifactFillId, deleted: false })
  .then((artifactToUpdate) => {
    // Update the filename
    artifactToUpdate[0].filename = testData.artifacts[2].filename;
    // Save the updated artifact
    return artifactToUpdate[0].save();
  })
  .then((artifact) => {
    chai.expect(artifact.filename).to.equal(testData.artifacts[2].filename);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Finds and deletes an artifact
 */
function deleteArtifactFile(done) {
  const artifactFillId = utils.createUID(org.id, project.id, testData.artifacts[0].id);
  // Attempt to find deleted artifact
  Artifact.findOneAndRemove({ id: artifactFillId })
  .then(() => Artifact.find({ id: artifactFillId }))
  .then((deletedArtifact) => {
    chai.expect(deletedArtifact.length).to.equal(0);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
