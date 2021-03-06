/**
 * @classification UNCLASSIFIED
 *
 * @module test.601a-user-api-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license Apache-2.0
 *
 * @owner Connor Doyle
 *
 * @author Leah De Laurell
 * @author Austin Bieber
 * @author Phillip Lee
 *
 * @description This tests the user API controller functionality:
 * GET, POST, PATCH, and DELETE a user.
 */

// NPM modules
const chai = require('chai');
const axios = require('axios');

// MBEE modules
const jmi = M.require('lib.jmi-conversions');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
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
   * Before: Runs before all tests. Creates admin user.
   */
  before(async () => {
    try {
      adminUser = await testUtils.createTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all tests. Deletes admin user.
   */
  after(async () => {
    try {
      // Delete test admin
      await testUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should GET the requesting users data', whoami);
  it('should POST a user', postUser);
  it('should POST multiple users', postUsers);
  it('should PUT a user', putUser);
  it('should PUT multiple users', putUsers);
  it('should GET a user', getUser);
  it('should GET multiple users', getUsers);
  it('should GET all users', getAllUsers);
  it('should GET users through search text', searchUsers);
  it('should PATCH a user', patchUser);
  it('should PATCH multiple users', patchUsers);
  it('should PATCH a users password', patchUserPassword);
  it('should DELETE a user', deleteUser);
  it('should DELETE multiple users', deleteUsers);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Makes a GET request to /api/users/whoami. Verifies return of
 * requesting user from API.
 */
async function whoami() {
  try {
    const userData = testData.adminUser;
    const options = {
      method: 'get',
      url: `${test.url}/api/users/whoami`,
      headers: testUtils.getHeaders()
    };

    // Make an API GET request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);

    // Verify response body
    // NOTE: Test admin does not have a name, custom data or email
    chai.expect(res.data.username).to.equal(userData.username);
    chai.expect(res.data).to.not.have.any.keys('password', '_id', '__v');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies POST /api/users/:username creates a user.
 * */
async function postUser() {
  try {
    const userData = testData.users[0];
    const options = {
      method: 'post',
      url: `${test.url}/api/users/${userData.username}`,
      headers: testUtils.getHeaders(),
      data: JSON.stringify(userData)
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const createdUser = res.data[0];

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
    chai.expect(createdUser.createdBy).to.equal(adminUser._id);
    chai.expect(createdUser.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(createdUser.archived).to.equal(false);
    chai.expect(createdUser).to.not.have.any.keys('archivedOn', 'archivedBy');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies POST /api/users creates multiple users.
 */
async function postUsers() {
  try {
    const userData = [
      testData.users[1],
      testData.users[2]
    ];

    const options = {
      method: 'post',
      url: `${test.url}/api/users/`,
      headers: testUtils.getHeaders(),
      data: userData
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const createdUsers = res.data;
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
      chai.expect(createdUser.createdBy).to.equal(adminUser._id);
      chai.expect(createdUser.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(createdUser.archived).to.equal(false);
      chai.expect(createdUser).to.not.have.any.keys('archivedOn', 'archivedBy');
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies PUT /api/users/:username creates or replaces a user.
 */
async function putUser() {
  try {
    const userData = testData.users[0];
    const options = {
      method: 'put',
      url: `${test.url}/api/users/${userData.username}`,
      headers: testUtils.getHeaders(),
      data: userData
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const replacedUser = res.data[0];

    // Verify expected response
    chai.expect(replacedUser.username).to.equal(userData.username);
    chai.expect(replacedUser.fname).to.equal(userData.fname);
    chai.expect(replacedUser.lname).to.equal(userData.lname);
    chai.expect(replacedUser.preferredName).to.equal(userData.preferredName);
    chai.expect(replacedUser.email).to.equal(userData.email);
    chai.expect(replacedUser.custom).to.deep.equal(userData.custom);
    chai.expect(replacedUser.admin).to.equal(userData.admin);
    chai.expect(replacedUser).to.not.have.any.keys('password', '_id', '__v');

    // Verify extra properties
    chai.expect(replacedUser.createdOn).to.not.equal(null);
    chai.expect(replacedUser.updatedOn).to.not.equal(null);
    chai.expect(replacedUser.createdBy).to.equal(adminUser._id);
    chai.expect(replacedUser.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(replacedUser.archived).to.equal(false);
    chai.expect(replacedUser).to.not.have.any.keys('archivedOn', 'archivedBy');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies PUT /api/users creates or replaces multiple users.
 */
async function putUsers() {
  try {
    const userData = [
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];

    const options = {
      method: 'put',
      url: `${test.url}/api/users/`,
      headers: testUtils.getHeaders(),
      data: userData
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const replacedUsers = res.data;

    // Expect correct number of users to be created
    chai.expect(replacedUsers.length).to.equal(userData.length);

    // Convert replacedUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, replacedUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const replacedUser = jmi2Users[userDataObject.username];

      // Verify expected response
      chai.expect(replacedUser.username).to.equal(userDataObject.username);
      chai.expect(replacedUser.fname).to.equal(userDataObject.fname);
      chai.expect(replacedUser.lname).to.equal(userDataObject.lname);
      chai.expect(replacedUser.preferredName).to.equal(userDataObject.preferredName);
      chai.expect(replacedUser.email).to.equal(userDataObject.email);
      chai.expect(replacedUser.custom).to.deep.equal(userDataObject.custom);
      chai.expect(replacedUser.admin).to.equal(userDataObject.admin);
      chai.expect(replacedUser).to.not.have.any.keys('password', '_id', '__v');

      // Verify extra properties
      chai.expect(replacedUser.createdOn).to.not.equal(null);
      chai.expect(replacedUser.updatedOn).to.not.equal(null);
      chai.expect(replacedUser.createdBy).to.equal(adminUser._id);
      chai.expect(replacedUser.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(replacedUser.archived).to.equal(false);
      chai.expect(replacedUser).to.not.have.any.keys('archivedOn', 'archivedBy');
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies GET /api/users/:username finds a user.
 */
async function getUser() {
  try {
    const userData = testData.users[0];
    const options = {
      method: 'get',
      url: `${test.url}/api/users/${userData.username}`,
      headers: testUtils.getHeaders()
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const foundUser = res.data[0];

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
    chai.expect(foundUser.createdBy).to.equal(adminUser._id);
    chai.expect(foundUser.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(foundUser.archived).to.equal(false);
    chai.expect(foundUser).to.not.have.any.keys('archivedOn', 'archivedBy');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies GET /api/users finds multiple users.
 */
async function getUsers() {
  try {
    const userData = [
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];

    const options = {
      method: 'get',
      url: `${test.url}/api/users`,
      headers: testUtils.getHeaders(),
      params: {
        usernames: userData.map(u => u.username).toString()
      }
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const foundUsers = res.data;

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
      chai.expect(foundUser.createdBy).to.equal(adminUser._id);
      chai.expect(foundUser.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundUser.archived).to.equal(false);
      chai.expect(foundUser).to.not.have.any.keys('archivedOn', 'archivedBy');
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies GET /api/users finds all users if no ids are provided.
 */
async function getAllUsers() {
  try {
    // Create request object
    const userData = [
      testData.adminUser,
      testData.users[0],
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];

    const options = {
      method: 'get',
      url: `${test.url}/api/users`,
      headers: testUtils.getHeaders()
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const foundUsers = res.data;
    // Expect correct number of users to be found
    chai.expect(foundUsers.length).to.be.at.least(userData.length);

    // Convert foundUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, foundUsers, 'username');
    // Loops through each user data object
    userData.forEach((userDataObject) => {
      const foundUser = jmi2Users[userDataObject.username];
      // Ensure user was found
      chai.expect(foundUser).to.not.equal(undefined);

      if (foundUser.username !== adminUser._id) {
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
        chai.expect(foundUser.createdBy).to.equal(adminUser._id);
        chai.expect(foundUser.lastModifiedBy).to.equal(adminUser._id);
        chai.expect(foundUser.archived).to.equal(false);
        chai.expect(foundUser).to.not.have.any.keys('archivedOn', 'archivedBy');
      }
      // Admin user special cases
      else {
        chai.expect(foundUser.username).to.equal(userDataObject.username);
        chai.expect(foundUser).to.not.have.any.keys('password', '_id', '__v');
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies GET /api/users/search.
 */
async function searchUsers() {
  try {
    // Create request object
    const userData = [
      testData.users[0],
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];

    const options = {
      method: 'get',
      url: `${test.url}/api/users/search?q=${userData[0].fname}`,
      headers: testUtils.getHeaders()
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status 200
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const foundUsers = res.data;
    // Expect correct number of users to be found
    chai.expect(foundUsers.length).to.equal(userData.length);

    // Convert foundUsers to JMI type 2 for easier lookup
    const jmi2Users = jmi.convertJMI(1, 2, foundUsers, 'username');
    // Loop through each user data object
    userData.forEach((userDataObject) => {
      const foundUser = jmi2Users[userDataObject.username];
      // Ensure user was found
      chai.expect(foundUser).to.not.equal(undefined);

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
      chai.expect(foundUser.createdBy).to.equal(adminUser._id);
      chai.expect(foundUser.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundUser.archived).to.equal(false);
      chai.expect(foundUser).to.not.have.any.keys('archivedOn', 'archivedBy');
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies PATCH /api/users/:username updates a user.
 */
async function patchUser() {
  try {
    const userData = testData.users[0];
    const updateObj = {
      username: userData.username,
      fname: 'Updated First Name'
    };

    const options = {
      method: 'patch',
      url: `${test.url}/api/users/${userData.username}`,
      headers: testUtils.getHeaders(),
      data: updateObj
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const updatedUser = res.data[0];

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
    chai.expect(updatedUser.createdBy).to.equal(adminUser._id);
    chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(updatedUser.archived).to.equal(false);
    chai.expect(updatedUser).to.not.have.any.keys('archivedOn', 'archivedBy');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies PATCH /api/users updates multiple users.
 */
async function patchUsers() {
  try {
    const userData = [
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];
    const updateObj = userData.map(u => ({
      username: u.username,
      fname: 'Updated First Name'
    }));

    const options = {
      method: 'patch',
      url: `${test.url}/api/users`,
      headers: testUtils.getHeaders(),
      data: updateObj
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const updatedUsers = res.data;
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
      chai.expect(updatedUser.createdBy).to.equal(adminUser._id);
      chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(updatedUser.archived).to.equal(false);
      chai.expect(updatedUser).to.not.have.any.keys('archivedOn', 'archivedBy');
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies mock PATCH request to update a users password.
 */
async function patchUserPassword() {
  try {
    // Create request object
    const userData = testData.users[0];
    userData._id = userData.username;
    const updateObj = {
      password: 'NewPass1234?',
      confirmPassword: 'NewPass1234?',
      oldPassword: userData.password
    };

    const options = {
      method: 'patch',
      url: `${test.url}/api/users/${userData.username}/password`,
      headers: testUtils.getHeaders('application/json', userData),
      data: JSON.stringify(updateObj)
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const updatedUser = res.data;

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
    chai.expect(updatedUser.createdBy).to.equal(adminUser._id);
    chai.expect(updatedUser.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(updatedUser.archived).to.equal(false);
    chai.expect(updatedUser).to.not.have.any.keys('archivedOn', 'archivedBy');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies DELETE /api/users/:username deletes a user.
 */
async function deleteUser() {
  try {
    const userData = testData.users[0];

    const options = {
      method: 'delete',
      url: `${test.url}/api/users/${userData.username}`,
      headers: testUtils.getHeaders(),
      data: userData
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const deletedUsername = res.data[0];

    // Verify expected response
    chai.expect(deletedUsername).to.equal(userData.username);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}

/**
 * @description Verifies DELETE /api/users/ deletes multiple users.
 */
async function deleteUsers() {
  try {
    const userData = [
      testData.users[1],
      testData.users[2],
      testData.users[3]
    ];

    const userIDs = userData.map(u => u.username);
    const ids = userIDs.join(',');

    const options = {
      method: 'delete',
      url: `${test.url}/api/users?ids=${ids}`,
      headers: testUtils.getHeaders()
    };

    // Make an API request
    const res = await axios(options);

    // Expect response status: 200 OK
    chai.expect(res.status).to.equal(200);
    // Verify response body
    const deletedUsernames = res.data;
    chai.expect(deletedUsernames.length).to.equal(userData.length);

    // Verify expected response
    chai.expect(deletedUsernames).to.have.members(userData.map(u => u.username));
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
  }
}
