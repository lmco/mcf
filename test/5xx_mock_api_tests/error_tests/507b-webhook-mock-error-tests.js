/**
 * @classification UNCLASSIFIED
 *
 * @module test.507b-webhook-mock-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests for expected errors in mock requests of webhook endpoints in the API
 * controller.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
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
   * Before: Run before all tests. Creates the admin user.
   */
  before(async () => {
    try {
      // Connect to the database
      await db.connect();
      // Create test admin
      adminUser = await testUtils.createTestAdmin();
      await testUtils.createNonAdminUser();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user.
   */
  after(async () => {
    try {
      // Delete test admin and test user
      await testUtils.removeTestAdmin();
      await testUtils.removeNonAdminUser();
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  // ------------- No Requesting User -------------
  // it('should reject a GET users request with no requesting user', noReqUser('getUsers'));
  // it('should reject a GET user request with no requesting user', noReqUser('getUser'));
  // it('should reject a POST users request with no requesting user', noReqUser('postUsers'));
  // it('should reject a POST user request with no requesting user', noReqUser('postUser'));
  // it('should reject a PATCH users request with no requesting user', noReqUser('patchUsers'));
  // it('should reject a PATCH user request with no requesting user', noReqUser('patchUser'));
  // it('should reject a PUT users request with no requesting user', noReqUser('putUsers'));
  // it('should reject a PUT user request with no requesting user', noReqUser('putUser'));
  // it('should reject a PATCH password request with no requesting user', noReqUser('patchPassword'));
  // it('should reject a DELETE users request with no requesting user', noReqUser('deleteUsers'));
  // it('should reject a DELETE user request with no requesting user', noReqUser('deleteUser'));
  // it('should reject a GET whoami user request with no requesting user', noReqUser('whoami'));
  // it('should reject a GET search user request with no requesting user', noReqUser('searchUsers'));
  // ------------- Invalid options -------------
  // it('should reject a GET users request with invalid options', invalidOptions('getUsers'));
  // it('should reject a GET user request with invalid options', invalidOptions('getUser'));
  // it('should reject a POST users request with invalid options', invalidOptions('postUsers'));
  // it('should reject a POST user request with invalid options', invalidOptions('postUser'));
  // it('should reject a PATCH users request with invalid options', invalidOptions('patchUsers'));
  // it('should reject a PATCH user request with invalid options', invalidOptions('patchUser'));
  // it('should reject a PUT users request with invalid options', invalidOptions('putUsers'));
  // it('should reject a PUT user request with invalid options', invalidOptions('putUser'));
  // it('should reject a DELETE users request with invalid options', invalidOptions('deleteUsers'));
  // it('should reject a DELETE user request with invalid options', invalidOptions('deleteUser'));
  // it('should reject a GET whoami request with invalid options', invalidOptions('whoami'));
  // it('should reject a GET search user request with invalid options', invalidOptions('searchUsers'));
  // ------- Non matching ids in body vs url -------
  // it('should reject a POST user request with conflicting ids in the body and url', conflictingIDs('postUser'));
  // it('should reject a PATCH user request with conflicting ids in the body and url', conflictingIDs('patchUser'));
  // it('should reject a PUT user request with conflicting ids in the body and url', conflictingIDs('putUser'));
  // ------------- 404 Not Found -------------
  // it('should return 404 for a GET users request that returned no results', notFound('getUsers'));
  // it('should return 404 for a GET user request for a nonexistent user', notFound('getUser'));
  // it('should return 404 for a PATCH users request for a nonexistent user', notFound('patchUsers'));
  // it('should return 404 for a PATCH user request for a nonexistent user', notFound('patchUser'));
  // it('should return 404 for a DELETE users request for a nonexistent user', notFound('deleteUsers'));
  // it('should return 404 for a DELETE user request for a nonexistent user', notFound('deleteUser'));
  // it('should return 404 for a PATCH password request for a nonexistent user', noReqUser('patchPassword'));
  // it('should return 404 for a GET search users request that returned no results', notFound('searchUsers'));
  // ------------- No arrays in singular endpoints -------------
  // it('should reject a POST singular user request containing an array in the body', noArrays('postUser'));
  // it('should reject a PATCH singular user request containing an array in the body', noArrays('patchUser'));
  // it('should reject a PUT singular user request containing an array in the body', noArrays('putUser'));
  // it('should reject a DELETE singular user request containing an array in the body', noArrays('deleteUser'));
  //  ------------- Trigger -------------
});

/* --------------------( Tests )-------------------- */
