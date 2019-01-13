/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.501a-user-mock-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE a user.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
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
  before((done) => {
    // Connect to the database
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((reqUser) => {
      adminUser = reqUser;
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
    // Delete test admin
    testUtils.removeTestAdmin()
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  // it('should get the requesting users data', whoami);
  //it('should POST a user', postUser);
  it('should POST multiple users', postUsers);
  // it('should GET a user', getUser);
  // it('should GET multiple users', getUsers);
  // it('should PATCH a user', patchUser);
  // it('should PATCH multiple users', patchUsers);
  // it('should DELETE a user', deleteUser);
  // it('should DELETE multiple users', deleteUsers);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock whoami request to get current user.
 */
function whoami(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const user = JSON.parse(_data);
    const testUser = testData.users[0];

    // Verify expected response
    // NOTE: Test admin does not have a name, custom data or email
    chai.expect(user.username).to.equal(testUser.username);
    chai.expect(user).to.not.have.any.keys('password', '_id', '__v');
    done();
  };

  // GETs the requesting user
  APIController.whoami(req, res);
}

/**
 * @description Verifies mock POST request to create a single user.
 */
function postUser(done) {
  // Create request object
  const userData = testData.users[0];
  const params = { username: userData.username };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, userData, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const createdUser = JSON.parse(_data);

    // Verify expected response
    chai.expect(createdUser.username).to.equal(userData.username);
    chai.expect(createdUser.fname).to.equal(userData.fname);
    chai.expect(createdUser.lname).to.equal(userData.lname);
    chai.expect(createdUser.preferredName).to.equal(userData.preferredName);
    chai.expect(createdUser.email).to.equal(userData.email);
    chai.expect(createdUser.custom).to.equal(userData.custom);
    chai.expect(createdUser.admin).to.equal(userData.admin);
    chai.expect(createdUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(createdUser.createdOn).to.not.equal(null);
    chai.expect(createdUser.updatedOn).to.not.equal(null);
    chai.expect(createdUser.createdBy).to.equal(adminUser.username);
    chai.expect(createdUser.lastModifiedBy).to.equal(adminUser.username);
    done();
  };

  // POSTs a user
  APIController.postUser(req, res);
}

/**
 * @description Verifies mock POST request to create multiple users.
 */
function postUsers(done) {
  // Create request object
  const userData = [
    testData.users[1],
    testData.users[2],
    testData.users[3]
  ];
  const params = {};
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, userData, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const createdUsers = JSON.parse(_data);
    // Expect correct number of users to be created
    chai.expect(createdUsers.length).to.equal(userData.length);

    // Convert createdUsers to JMI type 2 for easier lookup
    const jmi2Users = utils.convertJMI(1, 2, createdUsers);
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const createdUser = jmi2Users[userDataObject.username];

      // Verify expected response
      chai.expect(createdUser.username).to.equal(userDataObject.username);
      chai.expect(createdUser.fname).to.equal(userDataObject.fname);
      chai.expect(createdUser.lname).to.equal(userDataObject.lname);
      chai.expect(createdUser.preferredName).to.equal(userDataObject.preferredName);
      chai.expect(createdUser.email).to.equal(userDataObject.email);
      chai.expect(createdUser.custom).to.equal(userDataObject.custom);
      chai.expect(createdUser.admin).to.equal(userDataObject.admin);
      chai.expect(createdUser).to.not.have.any.keys('password', '_id', '__v');

      // Verify extra properties
      chai.expect(createdUser.createdOn).to.not.equal(null);
      chai.expect(createdUser.updatedOn).to.not.equal(null);
      chai.expect(createdUser.archivedOn).to.equal(null);
      chai.expect(createdUser.createdBy).to.equal(adminUser.username);
      chai.expect(createdUser.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(createdUser.archivedBy).to.equal(null);
    });
    done();
  };

  // POSTs multiple users
  APIController.postUsers(req, res);
}

