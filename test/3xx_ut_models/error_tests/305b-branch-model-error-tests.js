/**
 * Classification: UNCLASSIFIED
 *
 * @module test.305b-branch-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests for expected errors within the branch model.
 */

// Node modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Branch = M.require('models.branch');
const db = M.require('lib.db');

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
   * branch.
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
   * branch.
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
  it('should reject when a branch ID is too short', idTooShort);
  it('should reject when a branch ID is too long', idTooLong);
  it('should reject if no id (_id) is provided', idNotProvided);
  it('should reject if no project is provided', projectNotProvided);
  it('should reject if the project is invalid', projectInvalid);
  it('should reject if the source is invalid', sourceInvalid);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Attempts to create a branch with an id that is too short.
 */
function idTooShort(done) {
  const branchData = Object.assign({}, testData.branches[0]);
  branchData.project = 'org:proj';
  branchData.branch = 'org:proj:branch';

  // Change id to be too short.
  branchData._id = '01:01:0';

  // Create branch object
  const branchObject = new Branch(branchData);

  // Save branch
  branchObject.save()
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Branch created successfully.');
  })
  .catch((error) => {
    // If branch created successfully, fail the test
    if (error.message === 'Branch created successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.message).to.equal('Branch validation failed: _id: '
        + 'Too few characters in ID');
      done();
    }
  });
}

/**
 * @description Attempts to create a branch with an id that is too long.
 */
function idTooLong(done) {
  const branchData = Object.assign({}, testData.branches[0]);
  branchData.project = 'org:proj';

  // Change id to be too long.
  branchData._id = '012345678901234567890123456789012345:01234567890123456789'
    + '0123456789012345:01234567890123456789012345678901234567890123456789012'
    + '34567890123456789012345678901234567890123456789012345678901234567890123'
    + '45678901234567890123456789012345678901234567890123456789012';

  // Create branch object
  const branchObject = new Branch(branchData);

  // Save branch
  branchObject.save()
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Branch created successfully.');
  })
  .catch((error) => {
    // If branch created successfully, fail the test
    if (error.message === 'Branch created successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.message).to.equal('Branch validation failed: _id: '
        + 'Too many characters in ID');
      done();
    }
  });
}

/**
 * @description Attempts to create a branch with no id.
 */
function idNotProvided(done) {
  const branchData = Object.assign({}, testData.branches[0]);
  branchData.project = 'org:proj';

  // Create branch object
  const branchObject = new Branch(branchData);

  // Save branch
  branchObject.save()
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Branch created successfully.');
  })
  .catch((error) => {
    // If branch created successfully, fail the test
    if (error.message === 'Branch created successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.message).to.equal('Branch validation failed: _id: '
        + 'Path `_id` is required.');
      done();
    }
  });
}

/**
 * @description Attempts to create a branch with no project.
 */
function projectNotProvided(done) {
  const branchData = Object.assign({}, testData.branches[0]);
  branchData._id = `org:proj:${branchData.id}`;

  // Create branch object
  const branchObject = new Branch(branchData);

  // Save branch
  branchObject.save()
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Branch created successfully.');
  })
  .catch((error) => {
    // If branch created successfully, fail the test
    if (error.message === 'Branch created successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.message).to.equal('Branch validation failed: project: '
        + 'Path `project` is required.');
      done();
    }
  });
}

/**
 * @description Attempts to create a branch with an invalid project.
 */
async function projectInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid branch project test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const branchData = Object.assign({}, testData.branches[0]);
  branchData._id = `org:proj:${branchData.id}`;

  // Set invalid project
  branchData.project = 'invalid_project';

  // Create branch object
  const branchObject = new Branch(branchData);

  // Expect save() to fail with specific error message
  await branchObject.save().should.eventually.be.rejectedWith(
    `Branch validation failed: project: ${branchData.project} is not a valid project ID.`
  );
}

/**
 * @description Attempts to create a branch with an invalid source.
 */
async function sourceInvalid() {
  if (customValidators.hasOwnProperty('id')) {
    M.log.verbose('Skipping valid branch source test due to an existing custom'
      + ' validator.');
    this.skip();
  }

  const branchData = Object.assign({}, testData.branches[0]);
  branchData._id = `org:proj:${branchData.id}`;
  branchData.project = 'org:proj';

  // Set invalid source
  branchData.source = 'invalid_source';

  // Create branch object
  const branchObject = new Branch(branchData);

  // Expect save() to fail with specific error message
  await branchObject.save().should.eventually.be.rejectedWith(
    `Branch validation failed: source: ${branchData.source} is not a valid source ID.`
  );
}
