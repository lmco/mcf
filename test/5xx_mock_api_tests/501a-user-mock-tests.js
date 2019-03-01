/**
 * Classification: UNCLASSIFIED
 *
 * @module test.501a-user-mock-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
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

// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const jmi = M.require('lib.jmi-conversions');

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
  it('should get the requesting users data', whoami);
  it('should POST a user', postUser);
  it('should POST multiple users', postUsers);
  it('should GET a user', getUser);
  it('should GET multiple users', getUsers);
  it('should GET all users', getAllUsers);
  it('should PATCH a user', patchUser);
  it('should PATCH multiple users', patchUsers);
  it('should PATCH a users password', patchUserPassword);
  it('should DELETE a user', deleteUser);
  it('should DELETE multiple users', deleteUsers);
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
    const foundUser = JSON.parse(_data);

    // Verify expected response
    // NOTE: Test admin does not have a name, custom data or email
    chai.expect(foundUser.username).to.equal(adminUser.username);
    chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');
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
    chai.expect(createdUser.custom).to.deep.equal(userData.custom);
    chai.expect(createdUser.admin).to.equal(userData.admin);
    chai.expect(createdUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(createdUser.createdOn).to.not.equal(null);
    chai.expect(createdUser.updatedOn).to.not.equal(null);
    chai.expect(createdUser.createdBy).to.equal(adminUser.username);
    chai.expect(createdUser.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
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
    const jmi2Users = jmi.convertJMI(1, 2, createdUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const createdUser = jmi2Users[userDataObject.username];

      // Verify expected response
      chai.expect(createdUser.username).to.equal(userDataObject.username);
      chai.expect(createdUser.fname).to.equal(userDataObject.fname);
      chai.expect(createdUser.lname).to.equal(userDataObject.lname);
      chai.expect(createdUser.preferredName).to.equal(userDataObject.preferredName);
      chai.expect(createdUser.email).to.equal(userDataObject.email);
      chai.expect(createdUser.custom).to.deep.equal(userDataObject.custom);
      chai.expect(createdUser.admin).to.equal(userDataObject.admin);
      chai.expect(createdUser).to.not.have.any.keys('password', '_id', '__v');

      // Verify extra properties
      chai.expect(createdUser.createdOn).to.not.equal(null);
      chai.expect(createdUser.updatedOn).to.not.equal(null);
      chai.expect(createdUser.createdBy).to.equal(adminUser.username);
      chai.expect(createdUser.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(createdUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    });
    done();
  };

  // POSTs multiple users
  APIController.postUsers(req, res);
}

/**
 * @description Verifies mock GET request to find a single user.
 */
function getUser(done) {
  // Create request object
  const userData = testData.users[0];
  const params = { username: userData.username };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const foundUser = JSON.parse(_data);

    // Verify expected response
    chai.expect(foundUser.username).to.equal(userData.username);
    chai.expect(foundUser.fname).to.equal(userData.fname);
    chai.expect(foundUser.lname).to.equal(userData.lname);
    chai.expect(foundUser.preferredName).to.equal(userData.preferredName);
    chai.expect(foundUser.email).to.equal(userData.email);
    chai.expect(foundUser.custom).to.deep.equal(userData.custom);
    chai.expect(foundUser.admin).to.equal(userData.admin);
    chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(foundUser.createdOn).to.not.equal(null);
    chai.expect(foundUser.updatedOn).to.not.equal(null);
    chai.expect(foundUser.createdBy).to.equal(adminUser.username);
    chai.expect(foundUser.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    done();
  };

  // GETs a user
  APIController.getUser(req, res);
}

/**
 * @description Verifies mock GET request to find multiple users.
 */
function getUsers(done) {
  // Create request object
  const userData = [
    testData.users[1],
    testData.users[2],
    testData.users[3]
  ];
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, userData.map(u => u.username), method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const foundUsers = JSON.parse(_data);
    // Expect correct number of users to be found
    chai.expect(foundUsers.length).to.equal(userData.length);

    // Convert foundUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, foundUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const foundUser = jmi2Users[userDataObject.username];

      // Verify expected response
      chai.expect(foundUser.username).to.equal(userDataObject.username);
      chai.expect(foundUser.fname).to.equal(userDataObject.fname);
      chai.expect(foundUser.lname).to.equal(userDataObject.lname);
      chai.expect(foundUser.preferredName).to.equal(userDataObject.preferredName);
      chai.expect(foundUser.email).to.equal(userDataObject.email);
      chai.expect(foundUser.custom).to.deep.equal(userDataObject.custom);
      chai.expect(foundUser.admin).to.equal(userDataObject.admin);
      chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');

      // Verify extra properties
      chai.expect(foundUser.createdOn).to.not.equal(null);
      chai.expect(foundUser.updatedOn).to.not.equal(null);
      chai.expect(foundUser.createdBy).to.equal(adminUser.username);
      chai.expect(foundUser.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    });
    done();
  };

  // GETs multiple users
  APIController.getUsers(req, res);
}

/**
 * @description Verifies mock GET request to find all users.
 */
function getAllUsers(done) {
  // Create request object
  const userData = [
    testData.adminUser,
    testData.users[0],
    testData.users[1],
    testData.users[2],
    testData.users[3]
  ];
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const foundUsers = JSON.parse(_data);
    // Expect correct number of users to be found
    chai.expect(foundUsers.length).to.be.at.least(userData.length);

    // Convert foundUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, foundUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const foundUser = jmi2Users[userDataObject.username];
      // Ensure user was found
      chai.expect(foundUser).to.not.equal(undefined);

      if (foundUser.username !== adminUser.username) {
        // Verify expected response
        chai.expect(foundUser.username).to.equal(userDataObject.username);
        chai.expect(foundUser.fname).to.equal(userDataObject.fname);
        chai.expect(foundUser.lname).to.equal(userDataObject.lname);
        chai.expect(foundUser.preferredName).to.equal(userDataObject.preferredName);
        chai.expect(foundUser.email).to.equal(userDataObject.email);
        chai.expect(foundUser.custom).to.deep.equal(userDataObject.custom);
        chai.expect(foundUser.admin).to.equal(userDataObject.admin);
        chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');

        // Verify extra properties
        chai.expect(foundUser.createdOn).to.not.equal(null);
        chai.expect(foundUser.updatedOn).to.not.equal(null);
        chai.expect(foundUser.createdBy).to.equal(adminUser.username);
        chai.expect(foundUser.lastModifiedBy).to.equal(adminUser.username);
        chai.expect(foundUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
      }
      // Admin user special cases
      else {
        chai.expect(foundUser.username).to.equal(userDataObject.username);
        chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');
      }
    });
    done();
  };

  // GETs all users
  APIController.getUsers(req, res);
}

/**
 * @description Verifies mock PATCH request to update a single user.
 */
function patchUser(done) {
  // Create request object
  const userData = testData.users[0];
  const updateObj = {
    username: userData.username,
    fname: 'Updated First Name'
  };
  const params = { username: userData.username };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, updateObj, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const updatedUser = JSON.parse(_data);

    // Verify expected response
    chai.expect(updatedUser.username).to.equal(userData.username);
    chai.expect(updatedUser.fname).to.equal(updateObj.fname);
    chai.expect(updatedUser.lname).to.equal(userData.lname);
    chai.expect(updatedUser.preferredName).to.equal(userData.preferredName);
    chai.expect(updatedUser.email).to.equal(userData.email);
    chai.expect(updatedUser.custom).to.deep.equal(userData.custom);
    chai.expect(updatedUser.admin).to.equal(userData.admin);
    chai.expect(updatedUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(updatedUser.createdOn).to.not.equal(null);
    chai.expect(updatedUser.updatedOn).to.not.equal(null);
    chai.expect(updatedUser.createdBy).to.equal(adminUser.username);
    chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    done();
  };

  // PATCHs a user
  APIController.patchUser(req, res);
}

/**
 * @description Verifies mock PACTH request to update multiple users.
 */
function patchUsers(done) {
  // Create request object
  const userData = [
    testData.users[1],
    testData.users[2],
    testData.users[3]
  ];
  const updateObj = userData.map(u => ({
    username: u.username,
    fname: 'Updated First Name'
  }));
  const params = {};
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, updateObj, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const updatedUsers = JSON.parse(_data);
    // Expect correct number of users to be updated
    chai.expect(updatedUsers.length).to.equal(userData.length);

    // Convert updatedUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, updatedUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const updatedUser = jmi2Users[userDataObject.username];

      // Verify expected response
      chai.expect(updatedUser.username).to.equal(userDataObject.username);
      chai.expect(updatedUser.fname).to.equal('Updated First Name');
      chai.expect(updatedUser.lname).to.equal(userDataObject.lname);
      chai.expect(updatedUser.preferredName).to.equal(userDataObject.preferredName);
      chai.expect(updatedUser.email).to.equal(userDataObject.email);
      chai.expect(updatedUser.custom).to.deep.equal(userDataObject.custom);
      chai.expect(updatedUser.admin).to.equal(userDataObject.admin);
      chai.expect(updatedUser).to.not.have.any.keys('password', '_id', '__v');

      // Verify extra properties
      chai.expect(updatedUser.createdOn).to.not.equal(null);
      chai.expect(updatedUser.updatedOn).to.not.equal(null);
      chai.expect(updatedUser.createdBy).to.equal(adminUser.username);
      chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(updatedUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    });
    done();
  };

  // PATCHs multiple users
  APIController.patchUsers(req, res);
}

/**
 * @description Verifies mock PATCH request to update a users password.
 */
function patchUserPassword(done) {
  // Create request object
  const userData = testData.users[0];
  userData._id = userData.username;
  const body = {
    password: 'NewPass1234?',
    confirmPassword: 'NewPass1234?',
    oldPassword: userData.password
  };
  const params = { username: userData.username };
  const method = 'PATCH';
  const req = testUtils.createRequest(userData, params, body, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const updatedUser = JSON.parse(_data);

    // Verify expected response
    chai.expect(updatedUser.username).to.equal(userData.username);
    chai.expect(updatedUser.fname).to.equal('Updated First Name');
    chai.expect(updatedUser.lname).to.equal(userData.lname);
    chai.expect(updatedUser.preferredName).to.equal(userData.preferredName);
    chai.expect(updatedUser.email).to.equal(userData.email);
    chai.expect(updatedUser.custom).to.deep.equal(userData.custom);
    chai.expect(updatedUser.admin).to.equal(userData.admin);
    chai.expect(updatedUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(updatedUser.createdOn).to.not.equal(null);
    chai.expect(updatedUser.updatedOn).to.not.equal(null);
    chai.expect(updatedUser.createdBy).to.equal(adminUser.username);
    chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedUser).to.not.have.any.keys('archived', 'archivedOn', 'archivedBy');
    done();
  };

  // PATCHs a users password
  APIController.patchPassword(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a single user.
 */
function deleteUser(done) {
  // Create request object
  const userData = testData.users[0];
  const params = { username: userData.username };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const deletedUsername = JSON.parse(_data);

    // Verify expected response
    chai.expect(deletedUsername).to.equal(userData.username);
    done();
  };

  // DELETEs a user
  APIController.deleteUser(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple user.
 */
function deleteUsers(done) {
  // Create request object
  const userData = [
    testData.users[1],
    testData.users[2],
    testData.users[3]
  ];
  const params = {};
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, userData.map(u => u.username), method);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Convert response to JSON
    const deletedUsernames = JSON.parse(_data);
    chai.expect(deletedUsernames.length).to.equal(userData.length);

    // Verify expected response
    chai.expect(deletedUsernames).to.have.members(userData.map(u => u.username));
    done();
  };

  // DELETEs multiple users
  APIController.deleteUsers(req, res);
}
