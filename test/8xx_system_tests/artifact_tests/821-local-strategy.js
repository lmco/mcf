/**
 * @classification UNCLASSIFIED
 *
 * @module test.artifact_tests.821-local-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Tests the exported functions and classes from the
 * artifact local-strategy. If this strategy is NOT selected in the running
 * config, the tests will be skipped.
 */
// Node modules
const path = require('path');
const fs = require('fs');

// NPM modules
const chai = require('chai');

// MBEE modules
const testData = require(path.join(M.root, 'test', 'test_data.json'));
const localStrategy = M.require('artifact.local-strategy');

/* --------------------( Test Data )-------------------- */
let artifactBlob0 = null;
let artifactBlob1 = null;
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
   * After: Connect to database. Create an admin user, organization, and project.
   */
  before(async () => {
    // Get test file
    const artifactPath0 = path.join(
      M.root, testData.artifacts[0].location, testData.artifacts[0].filename
    );

    const artifactPath1 = path.join(
      M.root, testData.artifacts[1].location, testData.artifacts[1].filename
    );

    // Get the test file
    artifactBlob0 = await fs.readFileSync(artifactPath0);
    artifactBlob1 = await fs.readFileSync(artifactPath1);

    // Define project obj
    project = testData.projects[0];
  });

  /**
   * After: Remove Organization and project.
   * Close database connection.
   */
  after(async () => {
  });

  /* Execute the tests */
  it('should post artifact0 blob.', postBlob);
  it('should get artifact0 blob.', getBlob0);
  it('should put artifact1 blob.', putBlob);
  it('should get artifact1 blob.', getBlob1);
  it('should delete an artifact1 blob.', deleteBlob);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Posts an artifact blob.
 */
async function postBlob() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project.id,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded.
    await localStrategy.postBlob(artData, artifactBlob0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Gets artifact0 blob.
 */
async function getBlob0() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project.id,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded.
    const artifactBlob = await localStrategy.getBlob(artData);

    // Check return artifact is of buffer type
    chai.expect(Buffer.isBuffer(artifactBlob)).to.equal(true);

    // Deep compare both binaries
    chai.expect(artifactBlob).to.deep.equal(artifactBlob0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Puts an artifact blob.
 */
async function putBlob() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project.id,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded.
    await localStrategy.putBlob(artData, artifactBlob1);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Gets artifact1 blob.
 */
async function getBlob1() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project.id,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded.
    const artifactBlob = await localStrategy.getBlob(artData);

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
 * @description Deletes an artifact blob.
 */
async function deleteBlob() {
  const artData = {
    filename: testData.artifacts[0].filename,
    project: project.id,
    location: testData.artifacts[0].location
  };
  try {
    // Find the artifact previously uploaded
    await localStrategy.deleteBlob(artData);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
