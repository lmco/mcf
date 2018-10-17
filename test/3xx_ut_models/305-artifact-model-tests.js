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
const path = require('path');
const chai = require('chai');

// MBEE modules
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));

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
  it('should create a user', createUser);

});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user via model and save it to the database.
 */
function uploadArtifact(done) {
  // Create a new User object
  const user = new Artifact(testData.users[1]);
  // Save user object to the database
  user.save()
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
