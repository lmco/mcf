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
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin user.
   */
  before((done) => {
    // Connect to the database
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set global admin user
      adminUser = user;
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
   * After: Delete admin user.
   */
  after((done) => {
    // Find the admin user
    User.findOne({
      username: testData.users[0].adminUsername
    }, (error, user) => {
      // Expect no error
      chai.expect(error).to.equal(null);

      // Delete admin user
      user.remove((error2) => {
        // Expect no error
        chai.expect(error2).to.equal(null);

        // Disconnect from the database
        db.disconnect();
        done();
      });
    })
    .catch((error) => {
      // Disconnect from the database
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should upload an artifact', uploadArtifact);
  it('should upload second artifact with same file', uploadSecondArtifact);
  //it('should write out an artifact file', updateArtifact);
  it('should delete an artifact', deleteArtifactFile);

});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via model and save it to the database.
 */
function uploadArtifact(done) {
  let imgPath = path.join(M.root, testData.artifacts[0].location, testData.artifacts[0].filename);
  artifactPNG = fs.readFileSync(imgPath);

  artifactObjData = {
    id: testData.artifacts[0].id,
    contentType: 'png',
    filename: testData.artifacts[0].filename,
    location: imgPath
  }
  // Create artifact
  ArtifactController.createArtifact(adminUser, artifactObjData, artifactPNG)
  .then((artifact) => {
    // Verify artifact created properly
    chai.expect(artifact.filename).to.equal(testData.artifacts[0].filename);
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
 * @description Creates a second artifact via model and save it to the database.
 * Note: This artifact contains the same hash (the same file). Only id differs from
 * the previously created in uploadArtifact().
 */
function uploadSecondArtifact(done) {
  let imgPath = path.join(M.root, testData.artifacts[1].location, testData.artifacts[1].filename);
  artifactPNG = fs.readFileSync(imgPath);

  artifactObjData = {
    id: testData.artifacts[1].id,
    contentType: 'png',
    filename: testData.artifacts[1].filename,
    location: imgPath
  }
  // Create artifact
  ArtifactController.createArtifact(adminUser, artifactObjData, artifactPNG)
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
 * @description Finds an artifact via model and writes to a file.
 */
function writeArtifactFile(done) {
  done();
}

/**
 * @description Finds an artifact via model and writes to a file.
 */
function deleteArtifactFile(done) {
  // Create artifact
  ArtifactController.deleteArtifact(adminUser, testData.artifacts[0].id)
  .then((artifact) => {
    // Verify artifact deleted properly
    console.log(artifact);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
