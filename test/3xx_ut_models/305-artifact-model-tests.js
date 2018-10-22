/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.301-user-model-tests
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
const Artifact = M.require('models.artifact');
const db = M.require('lib.db');
const mbeeCrypto = M.require('lib.crypto');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
let artifactPNG = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open the database connection.
   */
  before(() => {
    db.connect();
  });

  /**
   * After: runs after all tests. Close database connection.
   */
  after(() => {
    db.disconnect();
  });

  /* Execute the tests */
  it('should upload an artifact', uploadArtifact);
  it('should write out an artifact file', writeArtifactFile);
  it('should delete an artifact', deleteArtifactFile);

});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an artifact via model and save it to the database.
 */
function uploadArtifact(done) {
  // Upload new artifact
  const artifact = new Artifact();
  artifact.contentType= 'png';
  artifact.id = testData.artifacts[0].id;
  artifact.filename = testData.artifacts[0].filename;
  artifact.location = testData.artifacts[0].location;
  let imgPath = path.join(M.root, artifact.location, artifact.filename)

  artifactPNG = fs.readFileSync(imgPath);
  artifact.hash = mbeeCrypto.md5Hash(artifactPNG);

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
 * @description Finds an artifact via model and writes to a file.
 */
function writeArtifactFile(done) {
  console.log(artifactPNG);
  // Find the artifact previously uploaded.
  Artifact.findOne({ id: testData.artifacts[0].id, deletedOn: null })
  .then((artifact) => {
    console.log(artifact);
    const fileDest = `/tmp/${artifact.filename}`;
    fs.writeFile(fileDest, artifactPNG, function(error){
      if (error){
        // Error occurred, log it
        M.log.error(error);
      }
    });

    // Verifies file was NOT created
    if (fs.exists(fileDest, (exist) => {
      // Check file NOT exist
      if (!exist){
        console.log(error);
        // Missing file, error out
        throw new M.CustomError('Artifact file not generated.');
      }
      done();
    }));
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Finds an artifact via model and writes to a file.
 */
function deleteArtifactFile(done) {
  // Find the previously created user from the createUser test.
  Artifact.findOne({ id: testData.artifacts[0].id})
  // Delete the user
  .then((artifact) => {
    console.log(artifact);
    console.log(`/tmp/${artifact.filename}`);
    // Remove artifact from filesystem
    fs.unlink(`/tmp/${artifact.filename}`, (error) => {
      if (error) throw new M.CustomError(error.message,400,'Artifact file could not be removed');
    })

    // Remove artifact from database
    artifact.remove();
  })
  .then(() => done())
  .catch(error => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });


}
