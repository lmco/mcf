/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.405-artifact-controller-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Tests the artifact model plugin by performing various actions.
 */

// Node modules
const chai = require('chai'); // Test framework
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// MBEE modules
const ArtifactController = M.require('controllers.artifact-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const User = M.require('models.user');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;
let org = null;
let proj = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, and project
   */
  before((done) => {
    // Open the database connection
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];
      projData.orgid = org.id;

      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
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
    OrgController.removeOrg(adminUser, org.id, true)
    .then(() => {
      // Once db items are removed, remove reqUser
      // Close the db connection and finish
      User.findOne({
        username: adminUser.username
      }, (error, foundUser) => {
        chai.expect(error).to.equal(null);
        foundUser.remove((error2) => {
          chai.expect(error2).to.equal(null);
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should upload artifact00', uploadArtifact);
  it('should upload second artifact01 with same file', uploadSecondArtifact);
  it('should update artifact01 with new file', updateArtifact);
  it('should find updated artifact01 new filename', findArtifact);
  it('should delete an artifact00', deleteArtifactFile);
  it('should delete second artifact01', deleteSecondArtifactFile);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Update an artifact with a new file.
 * Note: This result in a different hash. Both files should be archieved
 * and artifact history is updated
 */
function uploadArtifact(done) {
  // Find and read image
  const imgPath = path.join(M.root, testData.artifacts[0].location, testData.artifacts[0].filename);
  const artifactPNG = fs.readFileSync(imgPath);

  // Define and initialize the meta data
  const artifactMetaData = {
    id: testData.artifacts[0].id,
    filename: testData.artifacts[0].filename,
    artifactBlob: artifactPNG
  };

  const artifactObjData = {
    metaData: artifactMetaData,
    artifactBlob: artifactPNG
  };

  // Create artifact
  ArtifactController.createArtifact(adminUser, org.id, proj.id, artifactObjData)
  .then((artifact) => {
    // Verify artifact created properly
    chai.expect(artifact.filename).to.equal(testData.artifacts[0].filename);
    done();
  })
  .catch((error) => {
    M.log.error(error.description);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Creates a second artifact via model and save it to the database.
 * Note: This artifact contains the same hash (the same file). Only id differs from
 * the previously created in uploadArtifact().
 */
function uploadSecondArtifact(done) {
  // Find and read image
  const imgPath = path.join(M.root, testData.artifacts[1].location, testData.artifacts[1].filename);
  const artifactPNG = fs.readFileSync(imgPath);

  // Define and initialize the meta data
  const artifactMetaData = {
    id: testData.artifacts[1].id,
    filename: testData.artifacts[1].filename,
    artifactBlob: artifactPNG
  };

  const artifactObjData = {
    metaData: artifactMetaData,
    artifactBlob: artifactPNG
  };

  // Create artifact
  ArtifactController.createArtifact(adminUser, org.id, proj.id, artifactObjData)
  .then((artifact) => {
    // Verify artifact created properly
    chai.expect(artifact.filename).to.equal(testData.artifacts[1].filename);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Updates an existing artifact.
 */
function updateArtifact(done) {
  // Find and read image
  const imgPath = path.join(M.root, testData.artifacts[2].location, testData.artifacts[2].filename);
  const artifactPNG = fs.readFileSync(imgPath);

  // Extract the artifact id
  const artifactID = testData.artifacts[2].id;

  // Define artifact fields to update
  const artMetaData = {
    filename: testData.artifacts[2].filename,
    contentType: path.extname(testData.artifacts[2].filename)
  };

  // Create artfact to update object
  const artObjData = {
    metaData: artMetaData,
    artifactBlob: artifactPNG
  };
  // Create artifact
  ArtifactController.updateArtifact(adminUser, org.id, proj.id, artifactID, artObjData)
  .then((artifact) => {
    // Verify artifact created properly
    chai.expect(artifact.filename).to.equal(testData.artifacts[2].filename);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Find an existing artifact.
 */
function findArtifact(done) {
  // Find artifact
  ArtifactController.findArtifact(adminUser, org.id, proj.id, testData.artifacts[2].id)
  .then((artifact) => {
    // Verify artifact found properly
    chai.expect(artifact.id).to.equal(utils.createID(org.id, proj.id, testData.artifacts[2].id));
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Deletes the first artifact.
 */
function deleteArtifactFile(done) {
  // Create artifact
  ArtifactController.removeArtifact(adminUser, org.id, proj.id, testData.artifacts[0].id)
  .then((artifactID) => {
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Deletes the second artifact.
 */
function deleteSecondArtifactFile(done) {
  // Create artifact
  ArtifactController.removeArtifact(adminUser, org.id, proj.id, testData.artifacts[1].id)
  .then((artifactID) => {
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
