/**
 * @classification UNCLASSIFIED
 *
 * @module test.306b-artifact-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Tests for expected errors within the artifact model.
 */

// Node modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Artifact = M.require('models.artifact');
const db = M.require('lib.db');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const customValidators = M.config.validators || {};

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open database connection and create test
   * artifact.
   */
  before((done) => {
    db.connect()
      .then(() => done())
      .catch((error) => {
        chai.expect(error.message).to.equal(null);
        done();
      });
  });

  /**
   * After: runs after all tests. Close database connection and delete test
   * artifact.
   */
  after((done) => {
    db.disconnect()
      .then(() => done())
      .catch((error) => {
        chai.expect(error.message).to.equal(null);
        done();
      });
  });

  /* Execute the tests */
  it('should reject when an artifact ID is too short', idTooShort);
  it('should reject when an artifact ID is too long', idTooLong);
  it('should reject if no id (_id) is provided', idNotProvided);
  it('should reject an invalid artifact ID', invalidID);
  it('should reject if no project is provided', projectNotProvided);
  it('should reject if a project is invalid', projectInvalid);
  it('should reject if no branch is provided', branchNotProvided);
  it('should reject if a branch is invalid', branchInvalid);
  it('should reject if a parent is invalid', parentInvalid);
  it('should reject if a location is invalid', sourceInvalid);
  it('should reject if a location is provided with no filename', sourceWithNoTarget);
  it('should reject if a filename is invalid', targetInvalid);
  it('should reject if a filename is provided with no location', targetWithNoSource);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Attempts to create an artifact with an id that is too short.
 */
async function idTooShort() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Change id to be too short.
  artData._id = '01:01:01:0';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: _id: '
    + `Artifact ID length [${utils.parseID(artData._id).pop().length}] must not`
    + ' be less than 2 characters.');
}

/**
 * @description Attempts to create an artifact with an id that is too long.
 */
async function idTooLong() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Change id to be too long.
  artData._id = '012345678901234567890123456789012345:01234567890123456789'
    + '0123456789012345:012345678901234567890123456789012345:0123456789012345'
    + '67890123456789012345678901234567890123456789012345678901234567890123456'
    + '789012345678901234567890123456789012345678901234567890123456789012345678'
    + '901234567890123456789012';


  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: _id: '
    + `Artifact ID length [${artData._id.length - validators.branch.idLength - 1}]`
    + ` must not be more than ${validators.artifact.idLength - validators.branch.idLength - 1}`
    + ' characters.');
}

/**
 * @description Attempts to create an artifact with no id.
 */
async function idNotProvided() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: _id: '
    + 'Path `_id` is required.');
}

/**
 * @description Attempts to create an artifact with an invalid id.
 */
async function invalidID() {
  if (customValidators.hasOwnProperty('artifact_id') || customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact id test due to an existing custom'
      + ' validator.');
    this.skip();
  }
  const artData = Object.assign({}, testData.artifacts[0]);
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Change id to be invalid
  artData._id = 'INVALID_ELEM_ID';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: '
    + `_id: Invalid artifact ID [${artData._id}].`);
}

/**
 * @description Attempts to create an artifact with no project.
 */
async function projectNotProvided() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: project: '
    + 'Path `project` is required.');
}

/**
 * @description Attempts to create an artifact with an invalid project.
 */
async function projectInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact project test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Set invalid project
  artData.project = 'invalid_project';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    `Artifact validation failed: project: ${artData.project} is not a valid project ID.`
  );
}

/**
 * @description Attempts to create an artifact with no project.
 */
async function branchNotProvided() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.parent = 'org:proj:branch:model';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith('Artifact validation failed: branch: '
    + 'Path `branch` is required.');
}

/**
 * @description Attempts to create an artifact with an invalid branch.
 */
async function branchInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact branch test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.parent = 'org:proj:branch:model';

  // Set invalid branch
  artData.branch = 'invalid_branch';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    `Artifact validation failed: branch: ${artData.branch} is not a valid branch ID.`
  );
}

/**
 * @description Attempts to create an artifact with an invalid parent.
 */
async function parentInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact parent test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';

  // Set invalid parent
  artData.parent = 'invalid_parent';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    `Artifact validation failed: parent: ${artData.parent} is not a valid parent ID.`
  );
}

/**
 * @description Attempts to create an artifact with an invalid source.
 */
async function sourceInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact source test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Set invalid source
  artData.source = 'invalid_source';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    `Artifact validation failed: source: ${artData.source} is not a valid source ID.`
  );
}

/**
 * @description Attempts to create an artifact with a valid source but no target.
 */
async function sourceWithNoTarget() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';
  artData.source = 'org:proj:branch:model';

  // Set target to null
  artData.target = null;

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    'Artifact validation failed: source: Target is required if source is provided.'
  );
}

/**
 * @description Attempts to create an artifact with an invalid target.
 */
async function targetInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid artifact target test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';

  // Set invalid target
  artData.target = 'invalid_target';

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    `Artifact validation failed: target: ${artData.target} is not a valid target ID.`
  );
}

/**
 * @description Attempts to create an artifact with a valid target but no source.
 */
async function targetWithNoSource() {
  const artData = Object.assign({}, testData.artifacts[0]);
  artData._id = `org:proj:branch:${artData.id}`;
  artData.project = 'org:proj';
  artData.branch = 'org:proj:branch';
  artData.parent = 'org:proj:branch:model';
  artData.target = 'org:proj:branch:model';

  // Set source to null
  artData.source = null;

  // Create artifact object
  const artObject = Artifact.createDocument(artData);

  // Expect save() to fail with specific error message
  await artObject.save().should.eventually.be.rejectedWith(
    'Artifact validation failed: target: Source is required if target is provided.'
  );
}
